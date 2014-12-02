var _ = require('lodash');
var bluebird = require('bluebird');
var sqlFixtures = require('sql-fixtures');
var bookshelf = require('bookshelf');
var Bookends = require('../..');

var fixtureGenerator = null;
var knex = null;
var bookends = null;

var Parent, Child;

module.exports = function(dbConfig) {
  describe('bookends', function() {
    this.enableTimeouts(false);

    before(function() {
      fixtureGenerator = new sqlFixtures(dbConfig);
      knex = fixtureGenerator.knex;
      bookends = new Bookends(knex);

      var db = bookshelf(knex);

      Child = db.Model.extend({
        tableName: 'child'
      });

      Parent = db.Model.extend({
        tableName: 'parent',
        children: function() {
          return this.hasMany(Child, 'parent_id');
        }
      });
    });

    beforeEach(function(done) {
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
      fixtureGenerator.destroy(done);
    });

    describe('hydration', function() {
      it('should do a simple hydration', function(done) {
        var dataSpec = {
          parent: {
            string_column: 'value1',
            second_string_column: 'value2'
          }
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          bookends.hydrate(Parent, ['string_column']).then(function(records) {
            expect(records.length).to.equal(1);
            expect(records[0].string_column).to.equal('value1');
            expect(records[0]).to.not.have.property('second_string_column');
            done();
          });
        });
      });

      it('should hydrate a child relation with no unexpected columns returned', function(done) {
        var dataSpec = {
          parent: {
              string_column: 'value1'
          },
          child: {
            parent_id: 'parent:0',
            string_column: 'value2'
          }
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          // 'children=[string_column]'
          var hydration = [
            { relation: 'children', hydration: ['string_column']}
          ];

          bookends.hydrate(Parent, hydration).then(function(records) {
            var record = records.pop();
            expect(record.id).to.be.a('number');
            expect(record.children[0].string_column).to.equal('value2');
            expect(record.children[0]).to.not.have.property('id');
            expect(record.children[0]).to.not.have.property('parent_id');
            done();
          });
        });
      });

      it('should hydrate a child relation and return the foreign key column if it was requested', function(done) {
        var dataSpec = {
          parent: {
            string_column: 'value1'
          },
          child: {
            parent_id: 'parent:0',
            string_column: 'value2'
          }
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          // 'children=[string_column]'
          var hydration = [
            { relation: 'children', hydration: ['string_column', 'parent_id']}
          ];

          bookends.hydrate(Parent, hydration).then(function(records) {
            var record = records.pop();
            expect(record.id).to.be.a('number');
            expect(record.children[0].string_column).to.equal('value2');
            expect(record.children[0]).to.not.have.property('id');
            expect(record.children[0].parent_id).to.equal(record.id);
            done();
          });
        });
      });
    });
  });
};
