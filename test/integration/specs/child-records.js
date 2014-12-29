var Bookends = require('bookends');

module.exports = function(fixtureGenerator, bookends, Root, LevelOne, LevelOneB, LevelTwo) {
  var options = {
    single: true
  };

  bookends = new Bookends({
    includeChildCollectionMetadata: true
  });

  describe('child records', function() {
    it('should return child collection metadata if specified', function(done) {
      var dataSpec = {
        root: {
          string_column: 'root0'
        },
        levelone: [
          { string_column: 'levelone0', root_id: 'root:0' },
          { string_column: 'levelone1', root_id: 'root:0' }
        ]
      };

      fixtureGenerator.create(dataSpec).then(function(result) {
        bookends.hydrate(Root, options, '[string_column,levelOnes=[string_column]]').then(function(record) {
          expect(record.string_column).to.equal('root0');
          expect(record.levelOnes.records[0].string_column).to.equal('levelone0');
          expect(record.levelOnes.records[1].string_column).to.equal('levelone1');
          expect(record.levelOnes.count).to.equal(2);
          
          done();
        });
      });
    });

    it('should return grandchild collection metadata if specified', function(done) {
      var dataSpec = {
        root: {
          string_column: 'root0'
        },
        levelone: {
          string_column: 'levelone0',
          root_id: 'root:0'
        },
        leveltwo: {
          string_column: 'leveltwo0',
          levelone_id: 'levelone:0'
        }
      };

      fixtureGenerator.create(dataSpec).then(function() {
        bookends.hydrate(Root, options, '[string_column,levelOnes=[levelTwos=[string_column]]]').then(function(record) {
          expect(record.string_column).to.equal('root0');
          expect(record.levelOnes.records[0].levelTwos.records[0].string_column).to.equal('leveltwo0');
          expect(record.levelOnes.count).to.equal(1);
          expect(record.levelOnes.records[0].levelTwos.count).to.equal(1);

          done();
        });
      });
    });
  });
};

