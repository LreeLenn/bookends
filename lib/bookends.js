var _ = require('lodash');

function Bookends(config) {
  _.extend(this, config);
}

Bookends.prototype = {
  _getAggregation: function getAggregation(spec) {
    if (spec.aggregation.indexOf("custom.") === 0) {
      var customAgg = spec.aggregation.split('.')[1];
      return this.aggregations[customAgg];
    } else {
      return require('./aggregations/' + spec.aggregation);
    }
  },

  _getColumns: function getColumns(spec) {
    var columns;

    if (spec.hydration) {
      columns = _.filter(spec.hydration, _.isString);
      columns.push('id');
    } else if (spec.aggregation) {
      columns = this._getAggregation(spec).columns(spec);
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
    var relationSpecs = _.filter(hydration, _.isObject);

    if (prefix) {
      prefix = prefix + '.';
    } else {
      prefix = '';
    }

    return _.reduce(relationSpecs, function(relation, relationSpec) {
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

      _.each(subRelationSpecs, function(subRelationSpec) {
        var SubModel = this._getSubModel(Model, subRelationSpec.relation);
        var subRelations = this._getRelations([subRelationSpec], SubModel, relationSpec.relation);

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
    var aggregations = _.filter(hydration, function(h) {
      return h.hasOwnProperty('aggregation');
    });

    _.each(aggregations, function(aggregation) {
      record[aggregation.relation] = this._aggregate(record[aggregation.relation], aggregation);
    }, this);

    var subHydrations = _.filter(hydration, function(h) {
      return h.hasOwnProperty('hydration');
    });

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

  hydrate: function hydrate(Model, where, hydration) {
    var me = this;

    if (arguments.length === 2) {
      hydration = where;
      where = {};
    }

    if (!isNaN(where)) {
      where = {
        id: Number(where)
      };
    }

    return Model
      .collection()
      .query(function(qb) {
        qb.where(where);
      })
      .fetch({
        columns: _.filter(hydration, _.isString),
        withRelated: me._getRelations(hydration, Model)
      })
      .then(function(result) {
        return _.map(result.models, function(record) {
          record = record.toJSON();
          record = me._cleanUp(record, Model, hydration);
          return me._resolveAggregations(record, Model, hydration);
        });
      });
  }
};

module.exports = Bookends;
