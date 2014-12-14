var Bookends = require('bookends');

module.exports = function(fixtureGenerator, bookends, Root, LevelOne, LevelOneB, LevelTwo) {
  describe('max depth', function() {
    it('should default max depth to 10', function() {
      expect(bookends.maxDepth).to.equal(10);
    });

    it('should return an error if the hydration goes beyond the max depth', function(done) {
      var bookends = new Bookends({
        maxDepth: 3
      });

      expect(bookends.maxDepth).to.equal(3);

      var hydration = '[levelOnes=[root=[levelOnes=[root=[string_column]]]]]';

      bookends.hydrate(Root, hydration).then(function(record) {
        fail('Should not have called the success callback');
      }, function(error) {
        expect(error).to.contain('max set to 3');
        done();
      });
    });
  });
};
