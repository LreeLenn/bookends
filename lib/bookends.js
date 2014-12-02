var _ = require('lodash');

function Bookends(knex) {
  this.knex = knex;
}

function getColumns(spec, relation) {
  if (relation) {
    // get relation columns
    var relationSpec = _.find(spec, { relation: relation });
    return getColumns(relationSpec);
  } else {
    return _.filter(spec, _.isString);
  }
}

function getParentColumn(relationName, Model) {
  if (_.isFunction(Model.prototype[relationName])) {
    return Model.prototype[relationName]().relatedData.foreignKey;
  }
}

function getRelations(spec, Model) {
  var relationSpecs = _.filter(spec, _.isObject);

  return _.map(relationSpecs, function(relationSpec) {
    var relation = {};
    relation[relationSpec.relation] = function(qb) {
      var requestedColumns = getColumns(relationSpec.hydration);
      var parentColumn = getParentColumn(relationSpec.relation, Model);
      qb.columns(_.uniq(requestedColumns.concat(parentColumn)));
    };
    return relation;
  });
}

function cleanUp(model, spec) {
  var Model = model.constructor;
  model = model.toJSON();

  var relationSpecs = _.filter(spec, _.isObject);

  _.each(relationSpecs, function(relationSpec) {
    var parentColumn = getParentColumn(relationSpec.relation, Model);

    if (relationSpec.hydration.indexOf(parentColumn) < 0) {
      _.each(model[relationSpec.relation], function(relatedChild) {
        delete relatedChild[parentColumn];
      });
    }
  });

  return model;
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
        return _.map(result.models, function(m) { return cleanUp(m, hydrateSpec); });
      });
  }
};

module.exports = Bookends;
