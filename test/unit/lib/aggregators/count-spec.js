var _ = require('lodash');
var count = require('../../../../lib/aggregators/count');

describe('count', function() {
  describe('hydration', function() {
    it('should specify the id column', function() {
      expect(count.hydration()).to.eql(['id']);
    });
  });

  describe('aggregate', function() {
    it('should count', function() {
      var records = [{}, {}];
      var spec = {};

      expect(count.aggregate(records, spec)).to.eql({
        count: 2
      });
    });
  });
});
