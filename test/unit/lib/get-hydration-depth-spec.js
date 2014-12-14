var _ = require('lodash');
var getHydrationDepth = require('../../../lib/get-hydration-depth');

describe('get-hydration-depth', function() {
  it('should return the depth', function() {
    expect(getHydrationDepth('[column]')).to.equal(1);
    expect(getHydrationDepth('[column,relation=[subcolumn]]')).to.equal(2);
  });

  it('should consider the longest branch for depth', function() {
    var hydration = '[column,relation=[subcolumn,subrelation=[subsubcolumn]],anotherrelation=[anothercolumn]]';
    expect(getHydrationDepth(hydration)).to.equal(3);
  });

  it('should work with hydration arrays', function() {
    var hydration = [
      'column',
      { relation: 'relation', hydration: ['subcolumn'] }
    ];

    expect(getHydrationDepth(hydration)).to.equal(2);
  });
});
