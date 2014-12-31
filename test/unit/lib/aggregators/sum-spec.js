var _ = require('lodash');
var sum = require('../../../../lib/aggregators/sum');

describe('sum', function() {
  describe('hydration', function() {
    it('should use the params as the hydration', function() {
      var spec = { aggregation: { params: ['a'] } };

      expect(sum.hydration(spec)).to.eql(['a']);
    });
  });

  describe('aggregate', function() {
    it('should sum', function() {
      var records = [{ a: 1 }, { a: 2 }];
      var spec = { aggregation: { params: ['a'] } };

      expect(sum.aggregate(records, spec)).to.eql({
        sum: 3
      });
    });

    it('should sum numbers if they are strings', function() {
      var records = [{ a: '12' }, { a: 23 }];
      var spec = { aggregation: { params: ['a'] } };

      expect(sum.aggregate(records, spec)).to.eql({
        sum: 35
      });
    });
  });
});
