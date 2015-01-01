(ns site.build-html
  (:require [selmer.parser :refer [render-file]]))

(defn -main [& args]
  (let [index-html (render-file "templates/index.html" {:dev (= "debug" (first args))})]
    (.mkdir (java.io.File. "dist"))
    (spit "dist/index.html" index-html)))
