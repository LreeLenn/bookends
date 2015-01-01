(ns site.create-db)

(def knex (js/Knex. #js {:client "websql"}))
(def schema (.-schema knex))
(set! (.-knex js/window) knex)

(defn- table-basics [table]
  (.primary (. table increments "id"))
  (. table string "name"))

(defn- create-player-table [table]
  (table-basics table)
  (. table string "class")
  (. table integer "age"))

(defn- create-weapon-table [table]
  (table-basics table)
  (. table boolean "two_handed")
  (. table string "allowed_classes"))

(defn- create-attack-table [table]
  (table-basics table)
  (. table integer "weapon_id")
  (. table boolean "long_range")
  (. table integer "damage")
  (. table integer "recovery_time"))

(defn- create-player-weapon-table [table]
  (. table integer "player_id")
  (. table integer "weapon_id"))

(defn create []
  (let [drop-table-promises #js [(.dropTableIfExists schema "player")
                                 (.dropTableIfExists schema "weapon")
                                 (.dropTableIfExists schema "attack")
                                 (.dropTableIfExists schema "player_weapon")] 
        create-table-promises #js [(.createTableIfNotExists schema "player" create-player-table)
                                   (.createTableIfNotExists schema "weapon" create-weapon-table)
                                   (.createTableIfNotExists schema "attack" create-attack-table)
                                   (.createTableIfNotExists schema "playerweapon" create-player-weapon-table)]]

    (.then (.all js/Promise drop-table-promises) 
      #(.then (.all js/Promise create-table-promises) (fn [] (println "tables created"))))))
