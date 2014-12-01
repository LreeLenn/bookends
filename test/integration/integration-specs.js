var _ = require('lodash');
var bluebird = require('bluebird');
var sqlFixtures = require('sql-fixtures');
var Humid = require('../..');

module.exports = function(dbConfig) {
  describe('humid', function() {
    this.enableTimeouts(false);

    before(function(done) {
      this.fixtureGenerator = new sqlFixtures(dbConfig);
      this.knex = this.fixtureGenerator.knex;
      this.humid = new Humid(this.knex);
      done();
    });

    beforeEach(function(done) {
      var knex = this.knex;
      var me = this;

      var dropPromises = [
        knex.schema.dropTableIfExists('child_table'),
        knex.schema.dropTableIfExists('parent_table')
      ];

      bluebird.all(dropPromises).then(function() {
        knex.schema.createTable('parent_table', function(table) {
          table.increments('id').primary();
          table.string('string_column');
          table.string('second_string_column');
        }).then(function() {
          knex.schema.createTable('child_table', function(table) {
            table.increments('id').primary();
            table.string('string_column');
            table.integer('parent_id').references('parent_table.id');
          }).then(function() {
            done();
          });
        });
      });
    });

    after(function(done) {
      this.fixtureGenerator.destroy(done);
    });

    describe('simple hydration', function() {
      it('should do a simple hydration', function(done) {
        var dataSpec = {
          parent_table: {
            string_column: 'value1',
            second_string_column: 'value2'
          }
        };

        var humid = this.humid;
        this.fixtureGenerator.create(dataSpec).then(function(result) {
          var where = { id: result.parent_table[0].id };

          humid.hydrate('parent_table', where, ['id', 'string_column']).then(function(record) {
            expect(record.id).to.equal(result.parent_table[0].id);
            expect(record.string_column).to.equal('value1');
            expect(record).to.not.have.property('second_string_column');
            done();
          });
        });
      });
    });
  });
};
