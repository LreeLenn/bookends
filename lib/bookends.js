var _ = require('lodash');
var bluebird = require('bluebird');
var parser = require('./parser');

var mergeHydrations = require('./merge-hydrations');
var getHydration = require('./get-hydration');
var getHydrationDepth = require('./get-hydration-depth');

var passInWheres = require('./pass-in-wheres');



function Bookends(config) {
  config = config || {};
  _.extend(this, _.defaults(config, {
    maxDepth: 6,
    includeChildCollectionMetadata: false
  }));
}

Bookends.prototype = {
  _getAggregation: function getAggregation(spec) {
    if (spec.aggregation.custom) {
      return this.aggregations[spec.aggregation.method];
    } else {
      return require('./aggregations/' + spec.aggregation.method);
    }
  },

  _getBelongsToColumns: function getBelongsToColumns(Model, hydration) {
    hydration = getHydration(hydration);
    var relationSpecs = _.filter(hydration, 'relation');

    var columns = _.map(relationSpecs, function(relationSpec) {
      var relation = this._getRelation(Model, relationSpec.relation);

      if (relation.type === 'belongsTo') {
        return relation.foreignKey;
      }
    }, this);

    return _.compact(columns);
  },

  _getColumns: function getColumns(spec) {
    var columns;

    if (spec.hydration) {
      var specHydration = getHydration(spec.hydration);

      columns = _.filter(specHydration, _.isString);

      if (columns.length === 0) {
        columns = ['*'];
      } else {
        columns.push('id');
      }
    } else if (spec.aggregation) {
      columns = this._getAggregation(spec).hydration(spec);
    }

    return _.compact(_.uniq(columns));
  },

  _getRelation: function getRelation(Model, relationName) {
    if (_.isFunction(Model.prototype[relationName])) {
      return (new Model())[relationName]().relatedData;
    }
  },

  _getParentColumn: function getParentColumn(Model, relationName) {
    var relation = this._getRelation(Model, relationName);

    if (!relation) {
      return;
    }

    if (relation.type === 'hasMany' || relation.type === 'hasOne') {
      return relation.foreignKey ||
        (relation.parentTableName + '_' + relation.parentIdAttribute);
    }
  },

  _getRelatedModel: function getRelatedModel(Model, relationName) {
    var relation = this._getRelation(Model, relationName);
    return relation && relation.target;
  },

  _getChildColumns: function getChildColumns(Model, specs) {
    return _.map(specs, function(spec) {
      var relation = this._getRelation(Model, spec.relation);

      if (relation) {
        if (relation.type === 'hasMany') {
          return relation.parentIdAttribute;
        } else if (relation.type === 'belongsTo') {
          return relation.foreignKey;
        }
      }
    }, this);
  },

  _getWithRelated: function getWithRelated(Model, hydration, prefix) {
    hydration = getHydration(hydration);

    var relationSpecs = _.filter(hydration, 'relation');

    if (prefix) {
      prefix = prefix + '.';
    } else {
      prefix = '';
    }

    return _.reduce(relationSpecs, function(relation, relationSpec) {
      var hydration = relationSpec.hydration;

      if (relationSpec.aggregation) {
        var aggregation = this._getAggregation(relationSpec);
        hydration = getHydration(aggregation.hydration(relationSpec));
      }

      var subRelationSpecs = _.filter(hydration, 'relation');

      var requestedColumns = this._getColumns({ hydration: hydration });

      if (requestedColumns.length) {
        relation[prefix + relationSpec.relation] = (function(qb) {
          var parentColumn = this._getParentColumn(Model, relationSpec.relation);
          var ChildModel = this._getRelatedModel(Model, relationSpec.relation);
          var childColumns = this._getChildColumns(ChildModel, subRelationSpecs);
          qb.columns(_.compact(_.uniq(requestedColumns.concat(parentColumn, childColumns))));
        }).bind(this);
      }

      var SubModel = this._getRelatedModel(Model, relationSpec.relation);

      _.each(subRelationSpecs, function(subRelationSpec) {
        var subRelations = this._getWithRelated(SubModel, [subRelationSpec], prefix + relationSpec.relation);

        relation = _.extend(relation, subRelations);
      }, this);

      return relation;
    }, {}, this);
  },

  _cleanUp: function cleanUp(record, Model, hydration) {
    hydration = getHydration(hydration);
    var relationSpecs = _.filter(hydration, 'relation');

    _.each(relationSpecs, function(relationSpec) {
      var parentColumn = this._getParentColumn(Model, relationSpec.relation);

      if (parentColumn && _.isArray(record[relationSpec.relation])) {
        var ChildModel = this._getRelatedModel(Model, relationSpec.relation);

        var childRecords = _.map(record[relationSpec.relation], function(relatedChild) {
          var toOmit = _.filter([parentColumn, 'id'], function(column) {
            return !_.contains(relationSpec.hydration, column);
          });

          relatedChild = _.omit(relatedChild, toOmit);
          return this._cleanUp(relatedChild, ChildModel, relationSpec.hydration);
        }, this);

        if (this.includeChildCollectionMetadata) {
          record[relationSpec.relation] = {
            records: childRecords,
            count: childRecords.length
          };
        } else {
          record[relationSpec.relation] = childRecords;
        }
      }
    }, this);

    return record;
  },

  _aggregate: function aggregate(records, spec) {
    return this._getAggregation(spec).aggregate(records, spec);
  },

  _resolveAggregations: function resolveAggregations(record, Model, hydration) {
    hydration = getHydration(hydration);

    var aggregationSpecs = _.filter(hydration, 'aggregation');

    _.each(aggregationSpecs, function(aggSpec) {
      var aggregation = this._getAggregation(aggSpec);
      var ChildModel = this._getRelatedModel(Model, aggSpec.relation);
      var childRecords = record[aggSpec.relation];
      var subHydration = aggregation.hydration(aggSpec);

      childRecords = _.map(childRecords, function(childRecord) {
        return this._resolveAggregations(childRecord, ChildModel, subHydration);
      }, this);

      record[aggSpec.relation] = this._aggregate(childRecords, aggSpec);
    }, this);

    var subHydrations = _.difference(hydration, aggregationSpecs);

    _.each(subHydrations, function(subHydration) {
      var SubModel = this._getRelatedModel(Model, subHydration.relation);

      if (SubModel) {
        if (_.isArray(record[subHydration.relation])) {
          record[subHydration.relation] = _.map(record[subHydration.relation], function(subRecord) {
            return this._resolveAggregations(subRecord, SubModel, subHydration.hydration);
          }, this);
        } else {
          record[subHydration.relation] = this._resolveAggregations(record[subHydration.relation], SubModel, subHydration.hydration);
        }
      }
    }, this);

    return record;
  },

  _getTotalCount: function getTotalCount(Model, where) {
    return Model
      .collection()
      .query(function(qb) {
        if (where) {
          passInWheres(qb, where);
        }
        qb.count('*');
      })
      .fetch({ columns: [] })
      .then(function(result) {
        // the result is db specific
        // sqlite: count(*)
        // postgres: count
        // mysql: TODO

        var record = result.models[0].toJSON();
        return Number(record['count(*)'] || record.count || 0);
      });
  },

  _mergeHydrationWithDefaults: function mergeHydrationWithDefaults(hydration, Model) {
    var defaultHydrationEntry = _.find(this.defaultHydrations || [], { model: Model });

    if (defaultHydrationEntry) {
      hydration = getHydration(hydration);

      var defaultHydration = getHydration(defaultHydrationEntry.hydration);

      return mergeHydrations(defaultHydration, hydration);
    } else {
      return hydration;
    }
  },

  hydrate: function hydrate(Model, options, hydration) {
    function buildFinalResult(result) {
      var finalRecords =  _.map(result.models, function(record) {
        record = this._cleanUp(record.toJSON(), Model, hydration);
        return this._resolveAggregations(record, Model, hydration);
      }, this);

      if (options.single) {
        return finalRecords[0];
      } else {
        return {
          records: finalRecords,
          count: finalRecords.length,
          offset: options.offset || 0
        };
      }
    }

    try {
      var me = this;

      if (arguments.length === 2) {
        if (_.isString(options) || _.isArray(options)) {
          // options is actually the hydration
          hydration = options;
          options = {};
        }
      }

      options = options || {};
      hydration = hydration || '[*]';

      hydration = this._mergeHydrationWithDefaults(hydration, Model);

      var depth = getHydrationDepth(hydration);

      if(depth > this.maxDepth) {
        return bluebird.reject('Hydration depth is larger than the max (max set to ' + this.maxDepth + ')');
      }

      return Model
        .collection()
        .query(function(qb) {
          if (options.where) {
            passInWheres(qb, options.where);
          }

          if (options.orderBy) {
            qb.orderBy.apply(qb, options.orderBy);
          }

          if (options.offset) {
            qb.offset(options.offset);
          }

          if (options.limit) {
            qb.limit(options.limit);
          }
        })
        .fetch({
          columns: this._getColumns({ hydration: hydration })
                  .concat(this._getBelongsToColumns(Model, hydration)),
          withRelated: this._getWithRelated(Model, hydration)
        })
        .bind(this)
        .then(function(result) {
          var finalResult = buildFinalResult.call(this, result);

          if (options.totalCount) {
            return this._getTotalCount(Model, options.where).then(function(totalCount) {
              finalResult.totalCount = totalCount;
              return finalResult;
            });
          } else {
            return finalResult;
          }
        });
    } catch(e) {
      return bluebird.reject(e.message || e);
    }
  }
};

module.exports = Bookends;
