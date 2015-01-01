(ns site.garden.records
  (:require [garden.units :refer [px percent s em]]
            [garden.color :refer [rgb]]))

(defn export []
  [[:.records-list
    {:font-family "monospace"
     :background-color "white"
     :padding-left (px 14)}
    [:.object-view
     [:.object-view-title
      {:background-color "red"
       :color "white"}]
     [:.object-view-entry
      [:span
       {:display "inline-block"}
       ]]]
    [:p {:font-size (px 15)}]]
   [:.primitive-number
    {:color "blue"}] 
   [:.primitive-string
    {:color "green"}] 
   [:.indent
    {:margin-left (px 20)}] 
   [:.object-view-entry-key
    {:margin-right (px 10)
     :font-weight "bold"}]
   [:.expander-container
    {:position "relative"}
    [:.expander
     {:position "absolute"
      :left (px -10)
      :top 0
      :cursor "pointer"}]]
   ])
