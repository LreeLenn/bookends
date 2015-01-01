(ns site.populate-db
  (:require [cljs-promises.core :as p]))

(def knex (js/Knex. #js {:client "websql"}))

(defn populate []
  (let [knex-promise (. (knex "player") (insert #js {:name "Bob"}))]
    (p/resolve knex-promise)))
