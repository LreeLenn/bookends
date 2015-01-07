(ns demo.populate-db
  (:require [demo.data :as data]
            [demo.knex :refer [knex]]
            [cljs-promises.core :as p]
            [cljs-promises.async :as pasync]))

(defn- populate-table [name data]
  (. (knex name) (insert data)))

(defn populate []
  (let [populate-promises #js [(populate-table "authors" data/authors)
                               (populate-table "books" data/books)
                               (populate-table "subjects" data/subjects)]]
    (pasync/pair-port
      (. js/Promise all populate-promises))))
  
