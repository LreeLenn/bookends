var _ = require('lodash');

// TODO: allowing multiple wheres is really weird, and could use a rethink
// currently, the user should send in an array, where each entry in the array
// is one where clause. The weird part is where clauses can be objects or arrays
//
//
// this is an "ideal" wheres array -> [['foo', '=', 'bar']. { id: 4 }]
// it means "where foo = 'bar' and id = 4"
//
// but users can pass in a single where, such as
// ['foo', '=', 'bar']
//   or
// { id: 4 }
//
// in this case, we need to detect it's just a single where,
// but since single wheres can be arrays, it's a little hairy to make
// that detection

module.exports = function passInWheres(qb, wheres) {
  // TODO: for now, assuming if first element in the array is a string
  // then we got a single array based where (see above)
  if (!_.isArray(wheres) || _.isString(wheres[0])) {
    wheres = [wheres];
  }

  _.each(wheres, function(where, index) {
    var method = index == 0 && qb.where || qb.andWhere;

    // careful, isArray must come first,
    // because isObject returns true for arrays
    if (_.isArray(where)) {
      method.apply(qb, where);
    }
    else if (_.isObject(where)) {
      method.call(qb, where);
    }
  });
};
