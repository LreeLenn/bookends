var _ = require('lodash');
var bluebird = require('bluebird');
var sqlFixtures = require('sql-fixtures');
var bookshelf = require('bookshelf');
var Bookends = require('../..');

var fixtureGenerator = null;
var knex = null;
var bookends = new Bookends();

var Root, LevelOne, LevelTwo;

module.exports = function(dbConfig) {
  describe('bookends', function() {
    this.enableTimeouts(false);

    before(function() {
      fixtureGenerator = new sqlFixtures(dbConfig);
      knex = fixtureGenerator.knex;

      var db = bookshelf(knex);

      LevelTwo = db.Model.extend({
        tableName: 'leveltwo',
        levelOne: function() {
          return this.belongsTo(LevelOne);
        }
      });

      LevelOne = db.Model.extend({
        tableName: 'levelone',
        levelTwos: function() {
          return this.hasMany(LevelTwo);
        },
        root: function() {
          return this.belongsTo(Root);
        }
      });

      LevelOneB = db.Model.extend({
        tableName: 'leveloneb',
        levelOne: function() {
          return this.hasOne(LevelOne);
        }
      });

      Root = db.Model.extend({
        tableName: 'root',
        levelOnes: function() {
          return this.hasMany(LevelOne);
        }
      });
    });

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
      fixtureGenerator.destroy(done);
    });

    describe('hydration', function() {
      it('should do a simple hydration', function(done) {
        var dataSpec = {
          root: {
            string_column: 'value1',
            second_string_column: 'value2'
          }
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          bookends.hydrate(Root, ['string_column']).then(function(result) {
            var records = result.records;
            expect(records.length).to.equal(1);
            expect(records[0].string_column).to.equal('value1');
            expect(records[0]).to.not.have.property('second_string_column');
            done();
          });
        });
      });

      it('should hydrate a levelone relation with no unexpected columns returned', function(done) {
        var dataSpec = {
          root: {
              string_column: 'value1'
          },
          levelone: {
            root_id: 'root:0',
            string_column: 'value2'
          }
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          // 'leveloneren=[string_column]'
          var hydration = [
            { relation: 'levelOnes', hydration: ['string_column']}
          ];

          bookends.hydrate(Root, hydration).then(function(result) {
            var record = result.records.pop();
            expect(record.id).to.be.a('number');
            expect(record.levelOnes[0].string_column).to.equal('value2');
            expect(record.levelOnes[0]).to.not.have.property('id');
            expect(record.levelOnes[0]).to.not.have.property('root_id');
            done();
          });
        });
      });

      it('should hydrate a levelone relation and return the foreign key column if it was requested', function(done) {
        var dataSpec = {
          root: {
            string_column: 'value1'
          },
          levelone: {
            root_id: 'root:0',
            string_column: 'value2'
          }
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          // 'leveloneren=[string_column]'
          var hydration = [
            { relation: 'levelOnes', hydration: ['id', 'string_column', 'root_id']}
          ];

          bookends.hydrate(Root, hydration).then(function(result) {
            var record = result.records.pop();
            expect(record.id).to.be.a('number');
            expect(record.levelOnes[0].string_column).to.equal('value2');
            expect(record.levelOnes[0].id).to.be.a('number');
            expect(record.levelOnes[0].root_id).to.equal(record.id);
            done();
          });
        });
      });

      it('should hydrate a second level child relation', function(done) {
        var dataSpec = {
          root: {
            string_column: 'value1'
          },
          levelone: {
            root_id: 'root:0',
            string_column: 'value2'
          },
          leveltwo: {
            levelone_id: 'levelone:0',
            string_column: 'value3'
          }
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          // 'leveloneren=[string_column,leveloneren=[string_column]]'
          var hydration = [{
            relation: 'levelOnes',
            hydration: [
              'string_column',
              { relation: 'levelTwos', hydration: ['string_column']}
            ]
          }];

          bookends.hydrate(Root, hydration).then(function(result) {
            expect(result.records[0].levelOnes[0].levelTwos[0].string_column).to.equal('value3');
            expect(result.records[0].levelOnes[0].levelTwos[0]).to.not.have.property('levelone_id');
            done();
          });
        });
      });

      it('should hydrate a root relation', function(done) {
        var dataSpec = {
          root: {
            string_column: 'root0'
          },
          levelone: {
            root_id: 'root:0',
            string_column: 'levelone0'
          }
        };

        fixtureGenerator.create(dataSpec).then(function() {
          var hydration = [
            { relation: 'root', hydration: ['string_column'] }
          ];

          bookends.hydrate(LevelOne, hydration).then(function(result) {
            expect(result.records[0].root.string_column).to.equal('root0');
            done();
          });
        });
      });

      it('should hydrate a second level parent relation', function(done) {
        var dataSpec = {
          root: {
            string_column: 'root0'
          },
          levelone: {
            root_id: 'root:0',
            string_column: 'levelone0'
          },
          leveltwo: {
            levelone_id: 'levelone:0',
            string_column: 'leveltwo0'
          }
        };

        fixtureGenerator.create(dataSpec).then(function() {
          var hydration = [
            {
              relation: 'levelOne',
              hydration: [
                { relation: 'root', hydration: ['string_column'] }
              ]
            }
          ];

          bookends.hydrate(LevelTwo, hydration).then(function(result) {
            expect(result.records[0].levelOne.root.string_column).to.equal('root0');
            done();
          });
        });
      });

      it('should hydrate a sibling relation', function(done) {
        var dataSpec = {
          leveloneb: {
            string_column: 'leveloneb0'
          },
          levelone: {
            leveloneb_id: 'leveloneb:0',
            string_column: 'levelone0'
          }
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          // 'leveloneren=[string_column]'
          var hydration = [
            { relation: 'levelOne', hydration: ['string_column']}
          ];

          bookends.hydrate(LevelOneB, hydration).then(function(result) {
            var record = result.records.pop();
            expect(record.id).to.be.a('number');
            expect(record.levelOne.string_column).to.equal('levelone0');
            done();
          });
        });
      });
    });

    describe('single', function() {
      it('should return the first record if single is specified', function(done) {
        var dataSpec = {
          root: [{
            string_column: 'root0'
          }, {
            string_column: 'root1'
          }]
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          var options = {
            single: true
          };

          bookends.hydrate(Root, options, ['string_column']).then(function(record) {
            expect(record.string_column).to.equal('root0');
            done();
          });
        });
      });
    });

    describe('where', function() {
      it('should use the where clause', function(done) {
        var dataSpec = {
          root: [{
            string_column: 'root0',
            second_string_column: 'root0'
          }, {
            string_column: 'root1',
            second_string_column: 'root1'
          }]
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          var options = {
            where: { id: result.root[1].id }
          };

          bookends.hydrate(Root, options, ['string_column']).then(function(result) {
            expect(result.records.length).to.equal(1);
            expect(result.records[0].string_column).to.equal('root1');
            done();
          });
        });
      });

      it('should turn integers into id based where clauses', function(done) {
        var dataSpec = {
          root: [{
            string_column: 'root0',
            second_string_column: 'root0'
          }, {
            string_column: 'root1',
            second_string_column: 'root1'
          }]
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          var options = {
            where: result.root[1].id
          };

          bookends.hydrate(Root, options, ['string_column']).then(function(result) {
            expect(result.records.length).to.equal(1);
            expect(result.records[0].string_column).to.equal('root1');
            done();
          });
        });
      });
    });

    describe('orderBy', function() {
      beforeEach(function() {
        this.dataSpec = {
          root: [{
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
          bookends.hydrate(Root, options, ['string_column']).then(function(result) {
            var records = result.records;
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
          bookends.hydrate(Root, options, ['string_column']).then(function(result) {
            var records = result.records;
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
            root: {
              string_column: 'root0'
            },
            levelone: [
              {
                root_id: 'root:0',
                string_column: 'levelone0'
              },
              {
                root_id: 'root:0',
                string_column: 'levelone1'
              }
            ]
          };

          fixtureGenerator.create(dataSpec).then(function(result) {
            // 'leveloneren=count'
            var hydration = [
              { relation: 'levelOnes', aggregation: { method: 'count'} }
            ];

            bookends.hydrate(Root, hydration).then(function(result) {
              var record = result.records.pop();
              expect(record.levelOnes.count).to.equal(2);
              done();
            });
          });
        });

        it('should count the second level relation', function(done) {
          var dataSpec = {
            root: {
              string_column: 'root0'
            },
            levelone: {
              root_id: 'root:0',
              string_column: 'levelone0'
            },
            leveltwo: [
              {
                levelone_id: 'levelone:0',
                string_column: 'leveltwo0'
              },
              {
                levelone_id: 'levelone:0',
                string_column: 'leveltwo1'
              }
            ]
          };

          fixtureGenerator.create(dataSpec).then(function(result) {
            // 'leveloneren=count'
            var hydration = [
              {
                relation: 'levelOnes',
                hydration: [
                  { relation: 'levelTwos', aggregation: { method: 'count'} }
                ]
              }
            ];

            bookends.hydrate(Root, hydration).then(function(result) {
              var record = result.records.pop();
              expect(record.levelOnes[0].levelTwos.count).to.equal(2);
              done();
            });
          });
        });
      });

      describe('collect', function() {
        it('should collect the relation', function(done) {
          var dataSpec = {
            root: {
              string_column: 'root0'
            },
            levelone: [
              {
                root_id: 'root:0',
                string_column: 'levelone0'
              },
              {
                root_id: 'root:0',
                string_column: 'levelone1'
              }
            ]
          };

          fixtureGenerator.create(dataSpec).then(function(result) {
            // 'leveloneren=collect(string_column)'
            var hydration = [
              { relation: 'levelOnes', aggregation: { method: 'collect', params: ['string_column'] }}
            ];

            bookends.hydrate(Root, hydration).then(function(result) {
              var record = result.records.pop();
              expect(record.levelOnes).to.eql(['levelone0', 'levelone1']);
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
                return '[string_column,levelTwos=count]';
              },
              aggregate: function(records, spec) {
                // at this point each record should have
                //  string_column
                //  leveloneren = { count: <number> }
                expect(spec.aggregation.params).to.eql(['my param']);

                return _.map(records, function(record) {
                  return record.string_column + '/' + record.levelTwos.count;
                });
              }
            }
          }
        };

        var bookends = new Bookends(bookendsConfig);

        var dataSpec = {
          root: {
            string_column: 'root0'
          },
          levelone: [
            {
              root_id: 'root:0',
              string_column: 'levelone0'
            },
            {
              root_id: 'root:0',
              string_column: 'levelone1'
            }
          ],
          leveltwo: [
            {
              levelone_id: 'levelone:0',
              string_column: 'leveltwo0'
            }
          ]
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          // 'leveloneren=count'
          var hydration = [
            {
              relation: 'levelOnes',
              aggregation: {
                custom: true,
                method: 'myCustomAgg',
                params: ['my param']
              }
            }
          ];

          bookends.hydrate(Root, hydration).then(function(result) {
            expect(result.records[0].levelOnes).to.eql(['levelone0/1', 'levelone1/0']);
            done();
          });
        });
      });
    });

    describe('hydration as a string', function() {
      it('should work with hydration strings', function(done) {
        var dataSpec = {
          root: {
            string_column: 'root0'
          },
          levelone: [
            {
              root_id: 'root:0',
              string_column: 'levelone0'
            },
            {
              root_id: 'root:0',
              string_column: 'levelone1'
            }
          ]
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          var hydration = '[string_column,levelOnes=collect(string_column)]';

          bookends.hydrate(Root, hydration).then(function(result) {
            var record = result.records.pop();
            expect(record.string_column).to.equal('root0');
            expect(record.levelOnes).to.eql(['levelone0', 'levelone1']);
            done();
          });
        });
      });
    });
  });
};
