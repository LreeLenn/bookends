var _ = require('lodash');
var bluebird = require('bluebird');
var sqlFixtures = require('sql-fixtures');
var Bookends = require('../..');

module.exports = function(dbConfig) {
  describe('bookends', function() {
    this.enableTimeouts(false);

    before(function() {
      this.fixtureGenerator = new sqlFixtures(dbConfig);
      this.knex = this.fixtureGenerator.knex;
      this.bookends = new Bookends(this.knex);


    });

    beforeEach(function(done) {
      var knex = this.knex;
      var me = this;

      var dropPromises = [
        knex.schema.dropTableIfExists('child'),
        knex.schema.dropTableIfExists('parent')
      ];

      bluebird.all(dropPromises).then(function() {
        knex.schema.createTable('parent', function(table) {
          table.increments('id').primary();
          table.string('string_column');
          table.string('second_string_column');
        }).then(function() {
          knex.schema.createTable('child', function(table) {
            table.increments('id').primary();
            table.string('string_column');
            table.integer('parent_id').references('parent.id');
          }).then(function() {
            done();
          });
        });
      });
    });

    after(function(done) {
      this.fixtureGenerator.destroy(done);
    });

    describe('hydration', function() {
      it('should do a simple hydration', function(done) {
        var dataSpec = {
          parent: {
            string_column: 'value1',
            second_string_column: 'value2'
          }
        };

        var bookends = this.bookends;
        this.fixtureGenerator.create(dataSpec).then(function(result) {
          bookends.hydrate('parent', ['string_column']).then(function(records) {
            var record = records.pop();
            expect(record.string_column).to.equal('value1');
            expect(record).to.not.have.property('second_string_column');
            done();
          });
        });
      });

      it('should hydrate a child relation', function(done) {
        var dataSpec = {
          parent: {
              string_column: 'value1'
          },
          child: {
            parent_id: 'parent:0',
            string_column: 'value2'
          }
        };

        var bookends = this.bookends;
        this.fixtureGenerator.create(dataSpec).then(function(result) {
          bookends.hydrate('parent', ['child.string_column']).then(function(records) {
            var record = records.pop();
            expect(record.child[0].string_column).to.equal('value2');
          });
        });
      });
    });
  });
};
