var Bookends = require('bookends');

module.exports = function(fixtureGenerator, bookends, Root, LevelOne, LevelOneB, LevelTwo) {
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

    it('should have a reasonable default if no hydration provided', function(done) {
      var dataSpec = {
        root: {
          string_column: 'value1',
          second_string_column: 'value2'
        }
      };

      fixtureGenerator.create(dataSpec).then(function(result) {
        bookends.hydrate(Root).then(function(result) {
          var records = result.records;
          expect(records.length).to.equal(1);
          expect(records[0].string_column).to.equal('value1');
          expect(records[0].second_string_column).to.equal('value2');
          expect(records[0].id).to.be.a('number');
          done();
        });
      });
    });

    it('should allow the second param to be options', function(done) {
      var dataSpec = {
        root: [
        { string_column: 'root0' },
        { string_column: 'root1' }
        ]
      };

      fixtureGenerator.create(dataSpec).then(function(result) {
        var options = { where: { string_column: 'root1' }};

        bookends.hydrate(Root, options).then(function(result) {
          var records = result.records;
          expect(records.length).to.equal(1);
          expect(records[0].string_column).to.equal('root1');
          done();
        });
      });
    });

    it('should hydrate a levelone relation with no unexpected columns returned', function(done) {
      var dataSpec = {
        root: {
          string_column: 'root0'
        },
        levelone: {
          root_id: 'root:0',
          string_column: 'levelone0'
        }
      };

      fixtureGenerator.create(dataSpec).then(function(result) {
        // 'leveloneren=[string_column]'
        var hydration = [
        'string_column',
        { relation: 'levelOnes', hydration: ['string_column']}
        ];

        bookends.hydrate(Root, hydration).then(function(result) {
          var record = result.records.pop();
          expect(record.id).to.be.a('number');
          expect(record.string_column).to.equal('root0');
          expect(record.levelOnes[0].string_column).to.equal('levelone0');
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

    it('should hydrate a belongsTo relation', function(done) {
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
        'string_column',
        {
          relation: 'root',
          hydration: [
          'string_column',
          { relation: 'levelOnes', hydration: ['string_column'] }
          ]
        }
        ];

        bookends.hydrate(LevelOne, hydration).then(function(result) {
          var record = result.records.pop();
          expect(record.string_column).to.equal('levelone0');
          expect(record.root.string_column).to.equal('root0');
          expect(record.root.levelOnes[0].string_column).to.equal('levelone0');
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

  describe('default hydrations', function() {
    it('should merge in default hydrations', function(done) {
      var bookends = new Bookends({
        defaultHydrations: [{
          model: Root,
          hydration: '[second_string_column]'
        }]
      });

      var dataSpec = {
        root: {
          string_column: 'root0',
          second_string_column: 'rootSecond0'
        }
      };

      fixtureGenerator.create(dataSpec).then(function(result) {
        bookends.hydrate(Root, '[string_column]').then(function(result) {
          var record = result.records.pop();
          expect(record.string_column).to.equal('root0');
          expect(record.second_string_column).to.equal('rootSecond0');
          done();
        });
      });
    });
  });
};
