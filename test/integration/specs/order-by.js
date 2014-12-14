
module.exports = function(fixtureGenerator, bookends, Root, LevelOne, LevelOneB, LevelTwo) {
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
};
