var bluebird = require('bluebird');
var Bookends = require('../..');

module.exports = function(dbConfig) {
  var setup = require('./db-setup')(dbConfig);
  var bookends = new Bookends();
  var knex = setup.knex;

  describe('bookends', function() {
    this.enableTimeouts(false);

    beforeEach(function(done) {
      var dropPromises = [
        knex.schema.dropTableIfExists('leveloneb'),
        knex.schema.dropTableIfExists('leveltwo'),
        knex.schema.dropTableIfExists('levelone'),
        knex.schema.dropTableIfExists('root')
      ];

      bluebird.all(dropPromises).then(function() {
        knex.schema.createTable('root', function(table) {
          table.increments('id').primary();
          table.string('string_column');
          table.string('second_string_column');
        }).then(function() {
          knex.schema.createTable('levelone', function(table) {
            table.increments('id').primary();
            table.string('string_column');
            table.integer('root_id').references('root.id');
            table.integer('leveloneb_id').references('leveloneb.id');
          }).then(function() {
            knex.schema.createTable('leveltwo', function(table) {
              table.increments('id').primary();
              table.string('string_column');
              table.integer('levelone_id').references('levelone.id');
            }).then(function() {
              knex.schema.createTable('leveloneb', function(table) {
                table.increments('id').primary();
                table.string('string_column');
              }).then(function() {
                done();
              });
            });
          });
        });
      });
    });

    after(function(done) {
      setup.fixtureGenerator.destroy(done);
    });

    describe('specs', function() {
      require('./specs/aggregation')(setup.fixtureGenerator, bookends, setup.Root, setup.LevelOne, setup.LevelOneB, setup.LevelTwo);
      require('./specs/child-records')(setup.fixtureGenerator, bookends, setup.Root, setup.LevelOne, setup.LevelOneB, setup.LevelTwo);
      require('./specs/error-handling')(setup.fixtureGenerator, bookends, setup.Root, setup.LevelOne, setup.LevelOneB, setup.LevelTwo);
      require('./specs/hydration')(setup.fixtureGenerator, bookends, setup.Root, setup.LevelOne, setup.LevelOneB, setup.LevelTwo);
      require('./specs/max-depth')(setup.fixtureGenerator, bookends, setup.Root, setup.LevelOne, setup.LevelOneB, setup.LevelTwo);
      require('./specs/order-by')(setup.fixtureGenerator, bookends, setup.Root, setup.LevelOne, setup.LevelOneB, setup.LevelTwo);
      require('./specs/pagination')(setup.fixtureGenerator, bookends, setup.Root, setup.LevelOne, setup.LevelOneB, setup.LevelTwo);
      require('./specs/single')(setup.fixtureGenerator, bookends, setup.Root, setup.LevelOne, setup.LevelOneB, setup.LevelTwo);
      require('./specs/where')(setup.fixtureGenerator, bookends, setup.Root, setup.LevelOne, setup.LevelOneB, setup.LevelTwo);
    });
  });
};
