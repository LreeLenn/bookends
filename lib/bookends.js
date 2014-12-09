var _ = require('lodash');
var parser = require('./parser');

function Bookends(config) {
  _.extend(this, config);
}

Bookends.prototype = {
  _getAggregation: function getAggregation(spec) {
    if (spec.aggregation.custom) {
      return this.aggregations[spec.aggregation.method];
    } else {
      return require('./aggregations/' + spec.aggregation.method);
    }
  },

  _getColumns: function getColumns(spec) {
    var columns;

    if (spec.hydration) {
      if (_.isString(spec.hydration)) {
        spec.hydration = parser.parse(spec.hydration);
      }

      columns = _.filter(spec.hydration, _.isString);

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

  _getSubModel: function getSubModel(Model, relationName) {
    var relation = this._getRelation(Model, relationName);
    return relation && relation.target;
  },

  _getChildColumns: function getChildColumns(Model, specs) {
    return _.map(specs, function(spec) {
      var relation = this._getRelation(Model, spec.relation);
      return relation && relation.foreignKey;
    }, this);
  },

  _getRelations: function getRelations(hydration, Model, prefix) {
    if (_.isString(hydration)) {
      hydration = parser.parse(hydration);
    }

    var relationSpecs = _.filter(hydration, _.isObject);

    if (prefix) {
      prefix = prefix + '.';
    } else {
      prefix = '';
    }

    return _.reduce(relationSpecs, function(relation, relationSpec) {
      if (relationSpec.aggregation) {
        var aggregation = this._getAggregation(relationSpec);
        relationSpec.hydration = aggregation.hydration(relationSpec);

        if (_.isString(relationSpec.hydration)) {
          relationSpec.hydration = parser.parse(relationSpec.hydration);
        }
      }

      var subRelationSpecs = _.filter(relationSpec.hydration, _.isObject);

      var requestedColumns = this._getColumns(relationSpec);

      if (requestedColumns.length) {
        relation[prefix + relationSpec.relation] = (function(qb) {
          var parentColumn = this._getParentColumn(Model, relationSpec.relation);
          var ChildModel = this._getSubModel(Model, relationSpec.relation);
          var childColumns = this._getChildColumns(ChildModel, subRelationSpecs);
          qb.columns(_.compact(_.uniq(requestedColumns.concat(parentColumn, childColumns))));
        }).bind(this);
      }

      var SubModel = this._getSubModel(Model, relationSpec.relation);

      _.each(subRelationSpecs, function(subRelationSpec) {
        var subRelations = this._getRelations([subRelationSpec], SubModel, prefix + relationSpec.relation);

        relation = _.extend(relation, subRelations);
      }, this);

      return relation;
    }, {}, this);
  },

  _cleanUp: function cleanUp(record, Model, hydration) {
    var relationSpecs = _.filter(hydration, _.isObject);

    _.each(relationSpecs, function(relationSpec) {
      var parentColumn = this._getParentColumn(Model, relationSpec.relation);

      if (parentColumn && _.isArray(record[relationSpec.relation])) {
        var ChildModel = this._getSubModel(Model, relationSpec.relation);

        record[relationSpec.relation] = _.map(record[relationSpec.relation], function(relatedChild) {
          var toOmit = _.filter([parentColumn, 'id'], function(column) {
            return !_.contains(relationSpec.hydration, column);
          });

          relatedChild = _.omit(relatedChild, toOmit);
          return this._cleanUp(relatedChild, ChildModel, relationSpec.hydration);
        }, this);
      }
    }, this);

    return record;
  },

  _aggregate: function aggregate(records, spec) {
    return this._getAggregation(spec).aggregate(records, spec);
  },

  _resolveAggregations: function resolveAggregations(record, Model, hydration) {
    if (_.isString(hydration)) {
      hydration = parser.parse(hydration);
    }

    var aggregationSpecs = _.filter(hydration, function(h) {
      return h.hasOwnProperty('aggregation');
    });

    _.each(aggregationSpecs, function(aggSpec) {
      var aggregation = this._getAggregation(aggSpec);

      record[aggSpec.relation] = _.map(record[aggSpec.relation], function(childRecord) {
        var ChildModel = this._getSubModel(Model, aggSpec.relation);
        return this._resolveAggregations(childRecord, ChildModel, aggregation.hydration(aggSpec));
      }, this);

      record[aggSpec.relation] = this._aggregate(record[aggSpec.relation], aggSpec);
    }, this);

    var subHydrations = _.filter(hydration, function(h) {
      return h.hasOwnProperty('hydration') && !h.hasOwnProperty('aggregation');
    }, this);

    _.each(subHydrations, function(subHydration) {
      if (_.isArray(record[subHydration.relation]) && this._getParentColumn(Model, subHydration.relation)) {
        var SubModel = this._getSubModel(Model, subHydration.relation);
        record[subHydration.relation] = _.map(record[subHydration.relation], function(subRecord) {
          return this._resolveAggregations(subRecord, SubModel, subHydration.hydration);
        }, this);
      }
    }, this);

    return record;
  },

  _getTotalCount: function getTotalCount(Model, where) {
    return Model
      .collection()
      .query(function(qb) {
        if (where) {
          qb.where(where);
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

  hydrate: function hydrate(Model, options, hydration) {
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

    if (options.where && !isNaN(options.where)) {
      options.where = {
        id: Number(options.where)
      };
    }

    function buildFinalResult(result) {
      var finalRecords =  _.map(result.models, function(record) {
        record = record.toJSON();
        record = me._cleanUp(record, Model, hydration);
        return me._resolveAggregations(record, Model, hydration);
      });

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

    return Model
      .collection()
      .query(function(qb) {
        if (options.where) {
          qb.where(options.where);
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
        columns: this._getColumns({ hydration: hydration }),
        withRelated: this._getRelations(hydration, Model)
      })
      .bind(this)
      .then(function(result) {
        var finalResult = buildFinalResult(result);

        if (options.totalCount) {
          return this._getTotalCount(Model, options.where).then(function(totalCount) {
            finalResult.totalCount = totalCount;
            return finalResult;
          });
        } else {
          return finalResult;
        }
      });
  }
};

module.exports = Bookends;
