(ns site.models)

(def knex (js/Knex. #js {:client "websql"}))
(def db (js/Bookshelf. knex))
(def Model (.-Model db))


  ;var Root = db.Model.extend({
    ;tableName: 'root',
    ;levelOnes: function() {
      ;return this.hasMany(LevelOne);
    ;}
  ;});
(def Player (. Model extend #js {:tableName "player"}))

