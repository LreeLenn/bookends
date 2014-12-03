var _ = require('lodash');
var collect = require('../../../../lib/aggregations/collect');

describe('collect', function() {
  describe('columns', function() {
    it('should use the params as the columns', function() {
      var spec = { aggregation: { params: ['a'] } };

      expect(collect.columns(spec)).to.eql(['a']);
    });
  });

  describe('aggregate', function() {
    it('should collect', function() {
      var records = [{ a: 1 }, { a: 2 }];
      var spec = { aggregation: { params: ['a'] } };

      expect(collect.aggregate(records, spec)).to.eql([1, 2]);
    });
  });
});
