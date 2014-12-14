
module.exports = function(fixtureGenerator, bookends, Root, LevelOne, LevelOneB, LevelTwo) {
  describe('pagination', function() {
    beforeEach(function(done) {
      var dataSpec = { root: [] };
      for(var i = 0; i < 10; i += 1) {
        dataSpec.root.push({
          string_column: 'root' + i
        });
      }

      fixtureGenerator.create(dataSpec).then(function() {
        done();
      });
    });

    it('should take limit and offset into account', function(done) {
      var options = {
        limit: 5,
        offset: 3,
        orderBy: ['string_column']
      };

      bookends.hydrate(Root, options, '[string_column]').then(function(result) {
        expect(result.records.length).to.equal(5);
        expect(result.offset).to.equal(3);
        expect(result.count).to.equal(5);
        expect(result.records[0].string_column).to.equal('root3');
        expect(result.records[1].string_column).to.equal('root4');
        expect(result.records[2].string_column).to.equal('root5');
        expect(result.records[3].string_column).to.equal('root6');
        expect(result.records[4].string_column).to.equal('root7');
        done();
      });
    });

    it('should include totalCount if requested', function(done) {
      var options = {
        limit: 5,
        totalCount: true,
        orderBy: ['string_column']
      };

      bookends.hydrate(Root, options, '[string_column]').then(function(result) {
        expect(result.totalCount).to.equal(10);
        expect(result.count).to.equal(5);
        expect(result.records[0].string_column).to.equal('root0');
        done();
      });
    });

    it('should take where into account for totalCount', function(done) {
      var options = {
        limit: 5,
        totalCount: true,
        orderBy: ['string_column'],
        where: { string_column: 'root0' }
      };

      bookends.hydrate(Root, options, '[string_column]').then(function(result) {
        expect(result.totalCount).to.equal(1);
        expect(result.records[0].string_column).to.equal('root0');
        done();
      });
    });
  });
};
