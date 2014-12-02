var _ = require('lodash');

function Bookends(knex) {
  this.knex = knex;
}

function getColumns(spec) {
  var columns = _.filter(spec, _.isString);
  columns.push('id');

  return _.compact(_.uniq(columns));
}

function getParentColumn(Model, relationName) {
  if (_.isFunction(Model.prototype[relationName])) {
    return Model.prototype[relationName]().relatedData.foreignKey;
  }
}

function getChildModel(Model, relationName) {
  if (_.isFunction(Model.prototype[relationName])) {
    return Model.prototype[relationName]().relatedData.target;
  }
}

function getRelations(spec, Model) {
  var relationSpecs = _.filter(spec, _.isObject);

  return _.reduce(relationSpecs, function(relation, relationSpec) {
    var requestedColumns = getColumns(relationSpec.hydration);

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

function cleanUp(record, Model, spec) {
  var relationSpecs = _.filter(spec, _.isObject);

  _.each(relationSpecs, function(relationSpec) {
    var parentColumn = getParentColumn(Model, relationSpec.relation);
    var ChildModel = getChildModel(Model, relationSpec.relation);

    record[relationSpec.relation] = _.map(record[relationSpec.relation], function(relatedChild) {
      if (relationSpec.hydration.indexOf(parentColumn) < 0) {
        delete relatedChild[parentColumn];
      }

      return cleanUp(relatedChild, ChildModel, relationSpec.hydration);
    });
  });

  return record;
}

Bookends.prototype = {
  hydrate: function(Model, where, hydrateSpec) {
    if (arguments.length === 2) {
      hydrateSpec = where;
      where = {};
    }

    return Model
      .collection()
      .query(function(qb) {
        qb.where(where);
      })
      .fetch({
        columns: getColumns(hydrateSpec),
        withRelated: getRelations(hydrateSpec, Model)
      })
      .then(function(result) {
        return _.map(result.models, function(m) {
          return cleanUp(m.toJSON(), m.constructor, hydrateSpec);
        });
      });
  }
};

module.exports = Bookends;
