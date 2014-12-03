var _ = require('lodash');
var count = require('../../../../lib/aggregations/count');

describe('count', function() {
  describe('columns', function() {
    it('should specify the id column', function() {
      expect(count.columns()).to.eql(['id']);
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
