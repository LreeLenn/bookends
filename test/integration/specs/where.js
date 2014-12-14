
module.exports = function(fixtureGenerator, bookends, Root, LevelOne, LevelOneB, LevelTwo) {
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

    it('should allow multiple wheres', function(done) {
      var dataSpec = {
        root: [{
          string_column: 'root0',
          second_string_column: 'second'
        }, {
          string_column: 'root1',
          second_string_column: 'second'
        }]
      };

      fixtureGenerator.create(dataSpec).then(function(result) {
        var options = {
          where: [
          { string_column: 'root0' },
          { second_string_column: 'second' }
          ]
        };

        bookends.hydrate(Root, options, ['string_column']).then(function(result) {
          expect(result.records.length).to.equal(1);
          expect(result.records[0].string_column).to.equal('root0');
          done();
        });
      });
    });
  });
};
