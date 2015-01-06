(ns demo.components.records
  (:require [reagent.core :refer [atom]] ))

(declare object-view array-view)

(defn sort-keys [object]
  (let [keys (keys object)]
    (sort-by #(vector? (object %)) keys)))

(defn primitive? [obj]
  (or (string? obj)
      (number? obj)))

(defn primitive-view [p needs-comma]
  [:span
   (cond
     (string? p) [:span.primitive-string (str "\"" p "\"")]
     (number? p) [:span.primitive-number p])
   (when needs-comma ",")])

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
    (fn [title array needs-comma] 
      [:div.array-view.expander-container
       [expander collapsed]
       [title-view title "["]
       (if @collapsed
         "…"
         [:div.indent
          (for [object array]
            (let [is-last (= (last array) object)
                  needs-comma (not is-last)]
             (if (primitive? object)
              [:div
               [primitive-view object needs-comma]]
              [object-view nil object needs-comma])))])
       "]"
       (when needs-comma ",")])))

(defn key-value-view [keyname value needs-comma]
  [:div
   [:span.object-view-entry-key (str keyname ":")]
   [:span.object-view-entry-value [primitive-view value]]
   (when needs-comma ",")])

(defn object-view []
  (let [collapsed (atom false)]
    (fn [title object needs-comma] 
      [:div.object-view.expander-container
       [expander collapsed]
       [title-view title "{"]
       (if @collapsed
         "…"
         [:div.indent 
          (let [keys (sort-keys object)] 
            (for [key keys] 
              [:div.object-view-entry
               (let [keyname (name key)
                     value (object key)
                     is-last (= (last keys) key)
                     needs-comma (not is-last)] 
                 (cond
                   (vector? value) [array-view keyname value needs-comma]
                   (map? value)    [object-view keyname value needs-comma]
                   :else           [key-value-view keyname value needs-comma]))]))])
       "}"
       (when needs-comma ",")])))

(defn cmp [object]
  [:div.records-list
   [object-view nil object false]])
