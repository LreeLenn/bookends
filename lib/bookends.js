var _ = require('lodash');

function getColumns(spec) {
  var columns;

  if (spec.hydration) {
    columns = _.filter(spec.hydration, _.isString);
    columns.push('id');
  } else if (spec.aggregation) {
    columns = require('./aggregations/' + spec.aggregation).columns(spec);
  }

  return _.compact(_.uniq(columns));
}

function getRelation(Model, relationName) {
  if (_.isFunction(Model.prototype[relationName])) {
    return (new Model())[relationName]().relatedData;
  }
}

function getParentColumn(Model, relationName) {
  var relation = getRelation(Model, relationName);
  return (
    relation
    && (relation.type === 'hasMany' || relation.type === 'hasOne')
    && relation.foreignKey
  ) || undefined;
}

function getChildModel(Model, relationName) {
  var relation = getRelation(Model, relationName);
  return relation && relation.target;
}

function getRelations(spec, Model) {
  var relationSpecs = _.filter(spec, _.isObject);

  return _.reduce(relationSpecs, function(relation, relationSpec) {
    var requestedColumns = getColumns(relationSpec);

    if (requestedColumns.length) {
      relation[relationSpec.relation] = function(qb) {
        var parentColumn = getParentColumn(Model, relationSpec.relation);
        qb.columns(_.compact(_.uniq(requestedColumns.concat(parentColumn))));
      };
    }

    var subRelationSpecs = _.filter(relationSpec.hydration, _.isObject);

    _.each(subRelationSpecs, function(subRelationSpec) {
      var SubModel = getChildModel(Model, subRelationSpec.relation);
      var subRelations = getRelations([subRelationSpec], SubModel);

      subRelations = _.transform(subRelations, function(result, value, key) {
        result[relationSpec.relation + '.' + key] = value;
      });

      relation = _.extend(relation, subRelations);
    });

    return relation;
  }, {});
}

function cleanUp(record, Model, hydration) {
  var relationSpecs = _.filter(hydration, _.isObject);

  _.each(relationSpecs, function(relationSpec) {
    var parentColumn = getParentColumn(Model, relationSpec.relation);

    if (parentColumn) {
      var ChildModel = getChildModel(Model, relationSpec.relation);

      record[relationSpec.relation] = _.map(record[relationSpec.relation], function(relatedChild) {
        var toOmit = _.filter([parentColumn, 'id'], function(column) {
          return !_.contains(relationSpec.hydration, column);
        });

        relatedChild = _.omit(relatedChild, toOmit);
        return cleanUp(relatedChild, ChildModel, relationSpec.hydration);
      });
    }
  });

  return record;
}

function aggregate(records, spec) {
  return require('./aggregations/' + spec.aggregation).aggregate(records, spec);
}

function resolveAggregations(record, Model, hydration) {
  var aggregations = _.filter(hydration, function(h) {
    return h.hasOwnProperty('aggregation');
  });

  _.each(aggregations, function(aggregation) {
    record[aggregation.relation] = aggregate(record[aggregation.relation], aggregation);
  });

  var subHydrations = _.filter(hydration, function(h) {
    return h.hasOwnProperty('hydration');
  });

  _.each(subHydrations, function(subHydration) {
    if (getParentColumn(Model, subHydration.relation)) {
      var ChildModel = getChildModel(Model, subHydration.relation);
      record[subHydration.relation] = _.map(record[subHydration.relation], function(subRecord) {
        return resolveAggregations(subRecord, ChildModel, subHydration.hydration);
      });
    }
  });

  return record;
}

function Bookends() {
}

Bookends.prototype = {
  hydrate: function(Model, where, hydration) {
    if (arguments.length === 2) {
      hydration = where;
      where = {};
    }

    return Model
      .collection()
      .query(function(qb) {
        qb.where(where);
      })
      .fetch({
        columns: _.filter(hydration, _.isString),
        withRelated: getRelations(hydration, Model)
      })
      .then(function(result) {
        return _.map(result.models, function(record) {
          record = record.toJSON();
          record = cleanUp(record, Model, hydration);
          return resolveAggregations(record, Model, hydration);
        });
      });
  }
};

module.exports = Bookends;
