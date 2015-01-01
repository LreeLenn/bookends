(ns demo.components.records
  (:require [reagent.core :refer [atom]] ))

(declare object-view array-view)

(defn sort-keys [object]
  (let [keys (keys object)]
    (sort-by #(vector? (object %)) keys)))

(defn primitive? [obj]
  (or (string? obj)
      (number? obj)))

(defn primitive-view [p]
  (cond
    (string? p) [:span.primitive-string (str "\"" p "\"")]
    (number? p) [:span.primitive-number p]))

(defn expander [collapsed-atom]
  [:span.expander {:on-click #(swap! collapsed-atom not)} 
   (if @collapsed-atom "+" "-")])

(defn title-view [title opener]
  [:span
   (when title 
     [:span.object-view-entry-key
      (str title ": ")])
   opener])

(defn array-view []
  (let [collapsed (atom false)]
    (fn [title array] 
      [:div.array-view.expander-container
       [expander collapsed]
       [title-view title "["]
       (if @collapsed
         "…"
         [:div.indent
          (for [object array]
            (if (primitive? object)
              [:div
               [primitive-view object]]
              [object-view nil object]))])
       "]"])))

(defn key-value-view [keyname value]
  [:div
   [:span.object-view-entry-key (str keyname ":")]
   [:span.object-view-entry-value [primitive-view value]]])

(defn object-view []
  (let [collapsed (atom false)]
    (fn [title object] 
      [:div.object-view.expander-container
       [expander collapsed]
       [title-view title "{"]
       (if @collapsed
         "…"
         [:div.indent 
          (for [key (sort-keys object)] 
            [:div.object-view-entry
             (let [keyname (name key)
                   value (object key)] 
               (cond
                 (vector? value) [array-view keyname value]
                 (map? value)    [object-view keyname value]
                 :else           [key-value-view keyname value]))])])
       "}"])))

(defn cmp [object]
  [:div.records-list
   [object-view nil object]])
