(ns demo.components.db-schema
  (:require [reagent.core :refer [atom]]
            [demo.components.expander :as expander]))


(defn cmp []
  (let [collapsed (atom false)]
    (fn []
      [:header.db-schema (when @collapsed {:class "collapsed"})
       (when-not @collapsed
         [:div
          [:p "In this webpage is a small IndexedDB of books. Click on one of the examples to get started."]
          [:img {:src "img/schema.svg"}]])
       [expander/cmp collapsed "schema"]])))
