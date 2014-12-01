function Humid(knex) {
  this.knex = knex;
}

Humid.prototype = {
  hydrate: function(tableName, where, hydrateSpec) {
    return this.knex(tableName)
      .where(where)
      .column(hydrateSpec)
      .then(function(result) {
        return (result || []).pop();
      });
  }
};

module.exports = Humid;
