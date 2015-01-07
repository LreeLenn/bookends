(ns demo.components.models
  (:require [demo.knex :refer [knex]]))

(def db (js/Bookshelf. knex))
(def Model (.-Model db))

(declare Author Book Subject)


(def Author (. Model extend #js {:tableName "authors"
                                 :books (fn []
                                          (this-as this
                                                   (. this hasMany Book "author_id")))}))

(def Book (. Model extend #js {:tableName "books"
                               :author (fn []
                                         (this-as this
                                                  (. this belongsTo Author "author_id")))
                               :subject (fn []
                                          (this-as this
                                                   (. this belongsTo Subject "subject_id"  )))}))

(def Subject (. Model extend #js {:tableName "subjects"
                                  :books (fn []
                                           (this-as this
                                                    (. this hasMany Book "subject_id")))}))

(def all {"Author" Author
          "Book" Book
          "Subject" Subject})
