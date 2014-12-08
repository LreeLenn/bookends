var _ = require('lodash');
var bluebird = require('bluebird');
var sqlFixtures = require('sql-fixtures');
var bookshelf = require('bookshelf');
var Bookends = require('../..');

var fixtureGenerator = null;
var knex = null;
var bookends = new Bookends();

var Parent, Child, GrandChild;

module.exports = function(dbConfig) {
  describe('bookends', function() {
    this.enableTimeouts(false);

    before(function() {
      fixtureGenerator = new sqlFixtures(dbConfig);
      knex = fixtureGenerator.knex;

      var db = bookshelf(knex);

      GrandChild = db.Model.extend({
        tableName: 'grandchild',
        parent: function() {
          return this.belongsTo(Child);
        }
      });

      Child = db.Model.extend({
        tableName: 'child',
        children: function() {
          return this.hasMany(GrandChild);
        },
        parent: function() {
          return this.belongsTo(Parent);
        }
      });

      Sibling = db.Model.extend({
        tableName: 'sibling',
        sibling: function() {
          return this.hasOne(Child);
        }
      });

      Parent = db.Model.extend({
        tableName: 'parent',
        children: function() {
          return this.hasMany(Child);
        }
      });
    });

    beforeEach(function(done) {
      var dropPromises = [
        knex.schema.dropTableIfExists('sibling'),
        knex.schema.dropTableIfExists('grandchild'),
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
            table.integer('sibling_id').references('sibling.id');
          }).then(function() {
            knex.schema.createTable('grandchild', function(table) {
              table.increments('id').primary();
              table.string('string_column');
              table.integer('child_id').references('child.id');
            }).then(function() {
              knex.schema.createTable('sibling', function(table) {
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
            { relation: 'children', hydration: ['id', 'string_column', 'parent_id']}
          ];

          bookends.hydrate(Parent, hydration).then(function(records) {
            var record = records.pop();
            expect(record.id).to.be.a('number');
            expect(record.children[0].string_column).to.equal('value2');
            expect(record.children[0].id).to.be.a('number');
            expect(record.children[0].parent_id).to.equal(record.id);
            done();
          });
        });
      });

      it('should hydrate a second level relation', function(done) {
        var dataSpec = {
          parent: {
            string_column: 'value1'
          },
          child: {
            parent_id: 'parent:0',
            string_column: 'value2'
          },
          grandchild: {
            child_id: 'child:0',
            string_column: 'value3'
          }
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          // 'children=[string_column,children=[string_column]]'
          var hydration = [{
            relation: 'children',
            hydration: [
              'string_column',
              { relation: 'children', hydration: ['string_column']}
            ]
          }];

          bookends.hydrate(Parent, hydration).then(function(records) {
            expect(records[0].children[0].children[0].string_column).to.equal('value3');
            expect(records[0].children[0].children[0]).to.not.have.property('child_id');
            done();
          });
        });
      });

      it('should hydrate a parent relation', function(done) {
        var dataSpec = {
          parent: {
            string_column: 'parent0'
          },
          child: {
            parent_id: 'parent:0',
            string_column: 'child0'
          }
        };

        fixtureGenerator.create(dataSpec).then(function() {
          var hydration = [
            { relation: 'parent', hydration: ['string_column'] }
          ];

          bookends.hydrate(Child, hydration).then(function(records) {
            expect(records[0].parent.string_column).to.equal('parent0');
            done();
          });
        });
      });

      it('should hydrate a grandparent relation', function(done) {
        var dataSpec = {
          parent: {
            string_column: 'parent0'
          },
          child: {
            parent_id: 'parent:0',
            string_column: 'child0'
          },
          grandchild: {
            child_id: 'child:0',
            string_column: 'grandchild0'
          }
        };

        fixtureGenerator.create(dataSpec).then(function() {
          var hydration = [
            {
              relation: 'parent',
              hydration: [
                { relation: 'parent', hydration: ['string_column'] }
              ]
            }
          ];

          bookends.hydrate(GrandChild, hydration).then(function(records) {
            expect(records[0].parent.parent.string_column).to.equal('parent0');
            done();
          });
        });
      });

      it('should hydrate a sibling relation', function(done) {
        var dataSpec = {
          sibling: {
            string_column: 'sibling0'
          },
          child: {
            sibling_id: 'sibling:0',
            string_column: 'child0'
          }
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          // 'children=[string_column]'
          var hydration = [
            { relation: 'sibling', hydration: ['string_column']}
          ];

          bookends.hydrate(Sibling, hydration).then(function(records) {
            var record = records.pop();
            expect(record.id).to.be.a('number');
            expect(record.sibling.string_column).to.equal('child0');
            done();
          });
        });
      });
    });

    describe('where', function() {
      it('should use the where clause', function(done) {
        var dataSpec = {
          parent: [{
            string_column: 'parent0',
            second_string_column: 'parent0'
          }, {
            string_column: 'parent1',
            second_string_column: 'parent1'
          }]
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          var options = {
            where: { id: result.parent[1].id }
          };

          bookends.hydrate(Parent, options, ['string_column']).then(function(records) {
            expect(records.length).to.equal(1);
            expect(records[0].string_column).to.equal('parent1');
            done();
          });
        });
      });

      it('should turn integers into id based where clauses', function(done) {
        var dataSpec = {
          parent: [{
            string_column: 'parent0',
            second_string_column: 'parent0'
          }, {
            string_column: 'parent1',
            second_string_column: 'parent1'
          }]
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          var options = {
            where: result.parent[1].id
          };

          bookends.hydrate(Parent, options, ['string_column']).then(function(records) {
            expect(records.length).to.equal(1);
            expect(records[0].string_column).to.equal('parent1');
            done();
          });
        });
      });
    });

    describe('orderBy', function() {
      beforeEach(function() {
        this.dataSpec = {
          parent: [{
            string_column: 'h'
          }, {
            string_column: 'z'
          }, {
            string_column: 'a'
          }, {
            string_column: 'b'
          }]
        };
      });

      it('should order the records as requested', function(done) {
        fixtureGenerator.create(this.dataSpec).then(function(result) {
          var options = { orderBy: ['string_column', 'DESC'] };
          bookends.hydrate(Parent, options, ['string_column']).then(function(records) {
            expect(records.length).to.equal(4);
            expect(records[0].string_column).to.equal('z');
            expect(records[1].string_column).to.equal('h');
            expect(records[2].string_column).to.equal('b');
            expect(records[3].string_column).to.equal('a');
            done();
          });
        });
      });

      it('should default an order to ASC', function(done) {
        fixtureGenerator.create(this.dataSpec).then(function(result) {
          var options = { orderBy: ['string_column'] };
          bookends.hydrate(Parent, options, ['string_column']).then(function(records) {
            expect(records.length).to.equal(4);
            expect(records[0].string_column).to.equal('a');
            expect(records[1].string_column).to.equal('b');
            expect(records[2].string_column).to.equal('h');
            expect(records[3].string_column).to.equal('z');
            done();
          });
        });
      });
    });

    describe('aggregation', function() {
      describe('count', function() {
        it('should count the relation', function(done) {
          var dataSpec = {
            parent: {
              string_column: 'parent0'
            },
            child: [
              {
                parent_id: 'parent:0',
                string_column: 'child0'
              },
              {
                parent_id: 'parent:0',
                string_column: 'child1'
              }
            ]
          };

          fixtureGenerator.create(dataSpec).then(function(result) {
            // 'children=count'
            var hydration = [
              { relation: 'children', aggregation: { method: 'count'} }
            ];

            bookends.hydrate(Parent, hydration).then(function(records) {
              var record = records.pop();
              expect(record.children.count).to.equal(2);
              done();
            });
          });
        });

        it('should count the second level relation', function(done) {
          var dataSpec = {
            parent: {
              string_column: 'parent0'
            },
            child: {
              parent_id: 'parent:0',
              string_column: 'child0'
            },
            grandchild: [
              {
                child_id: 'child:0',
                string_column: 'grandchild0'
              },
              {
                child_id: 'child:0',
                string_column: 'grandchild1'
              }
            ]
          };

          fixtureGenerator.create(dataSpec).then(function(result) {
            // 'children=count'
            var hydration = [
              {
                relation: 'children',
                hydration: [
                  { relation: 'children', aggregation: { method: 'count'} }
                ]
              }
            ];

            bookends.hydrate(Parent, hydration).then(function(records) {
              var record = records.pop();
              expect(record.children[0].children.count).to.equal(2);
              done();
            });
          });
        });
      });

      describe('collect', function() {
        it('should collect the relation', function(done) {
          var dataSpec = {
            parent: {
              string_column: 'parent0'
            },
            child: [
              {
                parent_id: 'parent:0',
                string_column: 'child0'
              },
              {
                parent_id: 'parent:0',
                string_column: 'child1'
              }
            ]
          };

          fixtureGenerator.create(dataSpec).then(function(result) {
            // 'children=collect(string_column)'
            var hydration = [
              { relation: 'children', aggregation: { method: 'collect', params: ['string_column'] }}
            ];

            bookends.hydrate(Parent, hydration).then(function(records) {
              var record = records.pop();
              expect(record.children).to.eql(['child0', 'child1']);
              done();
            });
          });
        });
      });
    });

    describe('custom aggregation', function() {
      it('should use a custom aggregation', function(done) {
        var bookendsConfig = {
          aggregations: {
            myCustomAgg: {
              hydration: function(spec) {
                return '[string_column,children=count]';
              },
              aggregate: function(records, spec) {
                // at this point each record should have
                //  string_column
                //  children = { count: <number> }
                expect(spec.aggregation.params).to.eql(['my param']);

                return _.map(records, function(record) {
                  return record.string_column + '/' + record.children.count;
                });
              }
            }
          }
        };

        var bookends = new Bookends(bookendsConfig);

        var dataSpec = {
          parent: {
            string_column: 'parent0'
          },
          child: [
            {
              parent_id: 'parent:0',
              string_column: 'child0'
            },
            {
              parent_id: 'parent:0',
              string_column: 'child1'
            }
          ],
          grandchild: [
            {
              child_id: 'child:0',
              string_column: 'grandchild0'
            }
          ]
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          // 'children=count'
          var hydration = [
            {
              relation: 'children',
              aggregation: {
                custom: true,
                method: 'myCustomAgg',
                params: ['my param']
              }
            }
          ];

          bookends.hydrate(Parent, hydration).then(function(records) {
            expect(records[0].children).to.eql(['child0/1', 'child1/0']);
            done();
          });
        });
      });
    });

    describe('hydration as a string', function() {
      it('should work with hydration strings', function(done) {
        var dataSpec = {
          parent: {
            string_column: 'parent0'
          },
          child: [
            {
              parent_id: 'parent:0',
              string_column: 'child0'
            },
            {
              parent_id: 'parent:0',
              string_column: 'child1'
            }
          ]
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          var hydration = '[string_column,children=collect(string_column)]';

          bookends.hydrate(Parent, hydration).then(function(records) {
            var record = records.pop();
            expect(record.string_column).to.equal('parent0');
            expect(record.children).to.eql(['child0', 'child1']);
            done();
          });
        });
      });
    });
  });
};
