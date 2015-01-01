(ns site.copy-js
  (:require [clojure.java.io :refer [file copy]]))

(defn -main []
  (.mkdir (java.io.File. "dist/js"))
  (copy (file "../browser/bookends.js") (file "dist/js/bookends.js"))
  (copy (file "../node_modules/bookshelf/browser/bookshelf.js") (file "dist/js/bookshelf.js"))
  (copy (file "../node_modules/bookshelf/browser/knex.js") (file "dist/js/knex.js")))
