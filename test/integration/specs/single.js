
module.exports = function(fixtureGenerator, bookends, Root, LevelOne, LevelOneB, LevelTwo) {
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
};
