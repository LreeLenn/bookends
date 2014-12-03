var _ = require('lodash');
var parser = require('../../../../lib/parser');

describe('parser', function() {
  describe('parsing', function() {
    it('should parse the simplest case', function() {
      var parsed = parser.parse('[some_column]');

      expect(parsed).to.eql(['some_column']);
    });

    it('should parse a more complex case', function() {
      var parsed = parser.parse('[string_column,children=collect(some_param)]');

      expect(parsed[0]).to.equal('string_column');
      expect(parsed[1]).to.eql({
        relation: 'children',
        aggregation: {
          method: 'collect',
          params: ['some_param']
        }
      });
    });

    it('should completely ignore whitespace and newlines', function() {
      var spec = '[ string_column , \r\n\n children = \tcount ]';
      var parsed = parser.parse(spec);

      expect(parsed).to.eql([
        'string_column',
        { relation: 'children', aggregation: { method: 'count' }}
      ]);
    });
  });
});
