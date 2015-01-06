var _ = require('lodash');
var cleanRecord = require('../../../lib/clean-record');

describe('clean-record', function() {
  it('should clean the record with a simple hydration', function() {
    var record = { a: 1, b: 2, c: 3 };
    var hydration = ['a', 'c'];

    var cleanedRecord = cleanRecord(record, hydration);
    expect(cleanedRecord).to.eql({
      a: 1,
      c: 3
    });
  });

  it('should maintain relations when cleaning', function() {
    var record = { a: 1, b: 2, c: 3, rel1: 4, rel2: 5 };

    var hydration = [
      'a',
      'b',
      { relation: 'rel1', hydration: ['c'] }
    ];

    var cleanedRecord = cleanRecord(record, hydration);

    expect(cleanedRecord).to.eql({
      a: 1,
      b: 2,
      rel1: 4
    });
  });

  it('should allow all columns if one of them is *', function() {
    var record = { a: 1, b: 2 };
    var hydration = ['a', '*'];

    expect(cleanRecord(record, hydration)).to.eql(record);
  });
});

