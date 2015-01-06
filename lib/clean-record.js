var _ = require('lodash');

function getAllowedKeys(hydration) {
  var columns = _.filter(hydration, _.isString);
  var relations = _.pluck(_.filter(hydration, 'relation'), 'relation');

  return columns.concat(relations);
}

module.exports = function(record, hydration) {
  if (_.contains(hydration, '*')) {
    return record;
  }

  var allKeys = _.keys(record);
  var allowedKeys = getAllowedKeys(hydration);
  var disallowedKeys = _.difference(allKeys, allowedKeys);

  return _.omit(record, disallowedKeys);
};
