var _ = require('lodash');

module.exports = {
  hydration: function(spec) {
    return spec.aggregation.params;
  },

  aggregate: function(records, spec) {
    var values = _.pluck(records, spec.aggregation.params[0]);

    var sum = _.reduce(values, function(sum, num) {
      return sum + Number(num);
    }, 0);

    return {
      sum: sum
    };
  }
};
