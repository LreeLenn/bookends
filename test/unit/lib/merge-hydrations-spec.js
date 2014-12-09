var _ = require('lodash');
var mergeHydrations = require('../../../lib/merge-hydrations');

describe('merge-hydrations', function() {
  it('should merge two simple arrays', function() {
    var merged = mergeHydrations(['a'], ['b']);

    expect(merged).to.eql(['a', 'b']);
  });

  it('should union non-equivalent specs', function() {
    var merged = mergeHydrations([
      { relation: 'user', hydration: ['email']}
    ], [
      { relation: 'task', hydration: ['name']}
    ]);

    expect(merged).to.eql([
      { relation: 'user', hydration: ['email'] },
      { relation: 'task', hydration: ['name'] },
    ]);
  });

  it('should merge equivalent specs', function() {
    var merged = mergeHydrations([
      { relation: 'user', hydration: ['email']}
    ], [
      { relation: 'user', hydration: ['username']}
    ]);

    expect(merged).to.eql([
      { relation: 'user', hydration: ['email', 'username'] }
    ]);
  });

  it('should merge equivalent specs not at the root', function() {
    var merged = mergeHydrations([
      {
        relation: 'foo',
        hydration: [
          { relation: 'bar', hydration: ['prop1'] }
        ]
      }
    ], [
      {
        relation: 'foo',
        hydration: [
          { relation: 'bar', hydration: ['prop2'] }
        ]
      }
    ]);

    expect(merged).to.eql([
      {
        relation: 'foo',
        hydration: [
          { relation: 'bar', hydration: ['prop1', 'prop2'] }
        ]
      }
    ]);
  });
});
