var _ = require('lodash');
var parser = require('./parser');

module.exports = function getHydration(hydration) {
  if (_.isString(hydration)) {
    return parser.parse(hydration);
  } else {
    return hydration;
  }
};
