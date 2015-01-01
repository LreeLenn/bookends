(ns site.copy-js
  (:require [clojure.java.io :refer [file copy]]))

(defn -main []
  (.mkdir (java.io.File. "resources/templates/js"))
  (copy (file "../browser/bookends.js") (file "resources/templates/js/bookends.js"))
  (copy (file "../browser/bookshelf.js") (file "resources/templates/js/bookshelf.js"))
  (copy (file "../browser/knex.js") (file "resources/templates/js/knex.js")))
