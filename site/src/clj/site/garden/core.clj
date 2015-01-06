(ns site.garden.core
  (:require [garden.def :refer [defstylesheet defstyles]]
            [garden.units :refer [px em percent]]
            [site.garden.sandbox :as sandbox]
            [site.garden.page :as page]))

(defstyles stylesheet
  [:*
   {:border-radius "0 !important"}]
  [:.navbar
   {:margin-bottom 0
    :font-weight "normal"}]
  [:.center
   {:text-align "center"}]
  [:.navbar.navbar-default
   {:margin-bottom 0}]
  [:header
   [:.container 
    {:padding-top (px 60)}]]
  [:.summary
   {:margin [[0 0 (px 40) 0]]}]
  [:.callout
   {:margin-top (px 40)}]
  [:.success
   [:a
    {:color "white"
     :text-decoration "underline"}]]

  [:pre
   {:background-color "white"}]

  [:section.footer
   {:padding [[(px 10) 0]]}
   [:p
    {:font-size (em 0.7)
     :margin 0}]]

  [:img
   {:max-width (percent 100)}]
  
  (page/export)
  (sandbox/export))
