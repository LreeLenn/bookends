
var _ = require('lodash')
var fs = require('fs')

module.exports = fs.readdirSync(__dirname).reduce(function(aggregators, file) {
  if (file.indexOf('index.js') < 0) {
    aggregators[file.replace(".js", "")] = require(__dirname + "/" + file);
  }

  return aggregators;
}, {});


