(ns site.garden.page
  (:require [garden.units :refer [px percent s em]]
            [garden.color :refer [rgb]]))

(def max-width 700)

(defn export []
  [
   [:.page
    [:h2
     {:margin-top (px 80)
      :text-transform "none"}]
    [:pre
     {:max-width (px max-width)
      :margin [[(px 40) 0]]}]
    [:h3
     {:text-transform "none"}]
    [:h4
     {:margin-top (px 20)
      :text-transform "none"}]
    [:.alert
     {:margin-left 0
      :max-width (px max-width)
      :padding-bottom (px 15)}]
    [:p
     {:margin-bottom (px 40)
      :max-width (px max-width)}]
    [:li
     {:max-width (px max-width)}]]])
