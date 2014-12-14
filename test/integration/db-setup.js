var sqlFixtures = require('sql-fixtures');
var bookshelf = require('bookshelf');

module.exports = function(dbConfig) {
  var fixtureGenerator = new sqlFixtures(dbConfig);
  var knex = fixtureGenerator.knex;
  var db = bookshelf(knex);

  var LevelTwo = db.Model.extend({
    tableName: 'leveltwo',
    levelOne: function() {
      return this.belongsTo(LevelOne);
    }
  });

  var LevelOne = db.Model.extend({
    tableName: 'levelone',
    levelTwos: function() {
      return this.hasMany(LevelTwo);
    },
    root: function() {
      return this.belongsTo(Root);
    }
  });

  var LevelOneB = db.Model.extend({
    tableName: 'leveloneb',
    levelOne: function() {
      return this.hasOne(LevelOne);
    }
  });

  var Root = db.Model.extend({
    tableName: 'root',
    levelOnes: function() {
      return this.hasMany(LevelOne);
    }
  });

  return {
    fixtureGenerator: fixtureGenerator,
    knex: knex,
    Root: Root,
    LevelOne: LevelOne,
    LevelOneB: LevelOneB,
    LevelTwo: LevelTwo
  };
};
