

/**
 * Bookends parser
 *
 * parses Bookends's query language into a hydration array that bookends.hydrate()
 * can use. Real work handled by peg.js, the grammar is at parser/bookends.pegjs
 *
 * Examples
 * ========
 *
 * 'some_column, another_column' => ['some_column', 'another_column']
 *
 * 'some_column,some_relation=collect(some_column)'
 *   =>
 * [
 *    'some_column',
 *    { relation: 'some_relation', aggregation: 'count', params: ['some_column'] }
 * ]
 *
 *
 * 'some_column,some_relation=[some_column,some_sub_relation=count]'
 *   =>
 * [
 *    'some_column',
 *    {
 *      relation: 'some_relation',
 *      hydration: [
 *        'some_column'
 *        { relation: 'some_sub_relation', aggregation: 'count' }
 *      ]
 *    }
 * ]
 */

var fs = require('fs');
var PEG = require('pegjs');
var grammar = fs.readFileSync(__dirname + '/bookends.pegjs', 'utf8');

var parser = PEG.buildParser(grammar);

module.exports = {
  parse: function parse(input) {
    input = input.replace(/\s/g, '');
    return parser.parse(input);
  }
};
