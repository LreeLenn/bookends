var _ = require('lodash');

module.exports = {
  columns: function(spec) {
    return spec.params;
  },

  aggregate: function(records, spec) {
    return _.pluck(records, spec.params[0]);
  }
};
