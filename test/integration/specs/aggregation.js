var _ = require('lodash');
var Bookends = require('bookends');

module.exports = function(fixtureGenerator, bookends, Root, LevelOne, LevelOneB, LevelTwo) {
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
          bookends.hydrate(Root, '[levelOnes=collect(string_column)]').then(function(result) {
            var record = result.records.pop();
            expect(record.levelOnes).to.eql(['levelone0', 'levelone1']);
            done();
          });
        });
      });
    });

    describe('sum', function() {
      it('should sum the relation', function(done) {
        var dataSpec = {
          root: {
            string_column: 'root0'
          },
          levelone: [
          {
            root_id: 'root:0',
            string_column: '4'
          },
          {
            root_id: 'root:0',
            string_column: '7'
          }
          ]
        };

        fixtureGenerator.create(dataSpec).then(function(result) {
          var hydration = '[levelOnes=sum(string_column)]';

          bookends.hydrate(Root, hydration).then(function(result) {
            expect(result.records[0].levelOnes).to.eql({ sum: 11 });
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
};
