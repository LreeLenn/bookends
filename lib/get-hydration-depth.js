var _ = require('lodash');
var getHydration = require('./get-hydration');

module.exports = function getHydrationDepth(hydration) {
  hydration = getHydration(hydration);

  var childHydrationSpecs = _.filter(hydration, 'hydration');
  var childHydrationDepths = _.map(childHydrationSpecs, function(childHydrationSpec) {
    return getHydrationDepth(childHydrationSpec.hydration);
  });

  if (childHydrationDepths.length) {
    return _.max(childHydrationDepths) + 1;
  } else {
    return 1;
  }
};
