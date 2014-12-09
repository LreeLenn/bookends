var _ = require('lodash');

module.exports = function mergeHydrations(h1, h2) {
  var result = _.clone(h1);

  _.each(h2, function(h2Entry) {
    if (_.isString(h2Entry)) {
      if (!_.contains(result, h2Entry)) {
        result.push(h2Entry);
      }
    } else {
      var equivalent = _.find(result, { relation: h2Entry.relation });

      if (!equivalent) {
        result.push(h2Entry);
      } else {
        equivalent.hydration = mergeHydrations(equivalent.hydration, h2Entry.hydration);
      }
    }
  });

  return result;
};
