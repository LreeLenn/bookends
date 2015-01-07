(ns site.garden.hydration-display
  (:require [garden.units :refer [px percent s em]]
            [garden.color :refer [rgb]]))

(def bg-color "#DDD")
(def shadow-color "#BBB")
(def freelance-blue "#2c3e50")

(defn export []
  [
   [:.sql-view
    {:padding (px 10)
     :border [[(px 1) "solid" "grey"]]}
    [:.sql-view-header
     {:font-weight "bold"
      :display "inline-block"
      :width (px 100)}]]
   [:.examples
    {:text-align "center"
     :margin-bottom (px 20)
     :padding (px 20)}
    [:h3
     {:margin [[0 0 (px 10) 0]]
      :padding 0}]
    [:.example
     {:cursor "pointer"
      :margin [[(px 10) 0]]}
     [:.example-model
      {:display "inline-block"
       :font-weight "bold"
       :width (px 60)
       :text-align "right"
       :margin [[(px 2) (px 10) (px 2) (px 30)]]}]]
    [:.examples-tagline
     {:margin-left (px 10)
      :font-size (em 0.5)
      :font-style "italic"}]
    [:.examples-container
     {:text-align "left"
      :width (percent 50)
      :margin [[0 (percent 24)]]}]
    [:.expander
     {:color freelance-blue}]]
   [:.hydration-error
    {:color (rgb 255 150 150)
     :text-align "center"
     :width (percent 100)}]
   [:.hydration-display
    {:padding (px 20)
     :background-color bg-color}
    [:.hydration-display-title
     {:margin-top (px -10)
      :margin-bottom (px 10)
      :color shadow-color}]]
   [:.hydration-input
    {:text-align "center"
     :background-color freelance-blue
     :padding (px 20)}
    [:span.code
     {:display "inline-block"
      :color "white"
      :font-size (px 20)
      :font-family "Menlo, Monaco, Consolas, 'Courier New', monospace"}]
    [:input {:font-size (px 20)}]
    [:select {:font-size (px 20)}]]])
