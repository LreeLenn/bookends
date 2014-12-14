
module.exports = function(fixtureGenerator, bookends, Root, LevelOne, LevelOneB, LevelTwo) {
  describe('error handling', function() {
    describe('invalid hydration strings', function() {
      it('should reject if parsing fails', function() {
        var fn = function() {
          bookends.hydrate(Root, '[badhydration').then(function() {
            throw new Error('Should not have called the success callback');
          }, function(error) {
            expect(error).to.contain('end of input found');
          });
        };

        expect(fn).not.to.throw();
      });
    });
  });
};
