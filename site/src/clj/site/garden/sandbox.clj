(ns site.garden.sandbox
  (:require [garden.units :refer [px percent s em]]
            [garden.color :refer [rgb]]
            [site.garden.records :as records]
            [site.garden.hydration-display :as hydration-display]))

(defn export []
  [
   (records/export)
   (hydration-display/export)

   [:header.db-schema
    {:padding [[(px 40) 0]]}
    [:&.collapsed
     {:padding 0}]
    [:p {:margin-bottom (px 20)}]
    [:.expander
     {:color "white"}]]
   
   [:.expander
    {:cursor "pointer"}]
   
   [:.alert
    {:margin (px 40)
     :padding-bottom (px 40)}
    [:h3
     {:text-transform "none"}]]])
