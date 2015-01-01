(ns demo.create-db
  (:require [cljs-promises.async :as pasync]))

(def knex (js/Knex. #js {:client "websql"}))
(def schema (.-schema knex))
(set! (.-knex js/window) knex)

(defn- id [table]
  (.primary (. table increments "id")))

(defn- create-authors-table [table]
  (id table)
  (. table string "last_name")
  (. table string "first_name"))

(defn- create-books-table [table]
  (id table)
  (. table string "title")
  (. table integer "author_id")
  (. table integer "subject_id"))

(defn- create-subjects-table [table]
  (id table)
  (. table string "subject"))

(defn create []
  (let [drop-table-promises #js [(.dropTableIfExists schema "authors")
                                 (.dropTableIfExists schema "books")
                                 (.dropTableIfExists schema "subjects")] 
        create-table-promises #js [(.createTableIfNotExists schema "authors" create-authors-table)
                                   (.createTableIfNotExists schema "books" create-books-table)
                                   (.createTableIfNotExists schema "subjects" create-subjects-table)]]

    (pasync/pair-port (.then (.all js/Promise drop-table-promises) 
                             #(.all js/Promise create-table-promises)))))
