var _ = require('lodash');

function Bookends(knex) {
  this.knex = knex;
}

function getColumnsAt(level, spec) {
  var mapped = _.map(spec, function(entry) {
    if (_.isString(entry) && entry.indexOf('.') === -1) {
      return entry;
    }
  });

  return _.compact(mapped);
}

Bookends.prototype = {
  hydrate: function(tableName, where, hydrateSpec) {
    if (arguments.length == 2) {
      hydrateSpec = where;
      where = {};
    }

    return this.knex(tableName)
      .where(where)
      .column(getColumnsAt(0, hydrateSpec));
  }
};

module.exports = Bookends;
