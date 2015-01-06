(ns demo.components.sandbox
  (:require-macros [cljs.core.async.macros :refer [go]])
  (:require [reagent.core :refer [atom]]
            [demo.components.models :as models]
            [demo.hydrate :refer [hydrate]]
            [demo.components.records :as records]
            [demo.components.expander :as expander]
            [cljs.core.async :refer [<!]]))

(def model (atom models/Author))
(def hydration (atom nil))

(def hydration-result (atom nil))
(def hydration-error (atom nil))


(defn do-hydration []
  (go
    (when (and @model @hydration)
      (let [hr (<! (hydrate @model @hydration))
            result (hr 0)
            error (hr 1)]
        (if result
          (do
            (reset! hydration-result result)
            (reset! hydration-error nil))
          (reset! hydration-error error))))))

(defn set-hydration [new-model new-hydration]
  (reset! model new-model)
  (reset! hydration new-hydration)
  (do-hydration))

(defn example [model modelName hydration]
  [:div.example
   [:a {:on-click #(set-hydration model hydration)}
    [:span.example-model modelName]
    [:span.example-hydration hydration]]])

(defn examples []
  (let [collapsed (atom false)] 
    (fn [] 
      [:div.examples (when @collapsed {:style {:padding 0 :margin 0}})
       (when-not @collapsed [:h3 "Examples"])
       (when-not @collapsed [:div.examples-container
        [example models/Author "Author" "[first_name,last_name]"]
        [example models/Book "Book" "[id,title]"]
        [example models/Author "Author" "[first_name,last_name,books=[title]]"]
        [example models/Subject "Subject" "[subject,books=count]"]
        [example models/Subject "Subject" "[subject,books=collect(title)]"]
        [example models/Author "Author" "[first_name,last_name,books=[title,subject=[subject]]]"]])
       [expander/cmp collapsed "examples"]])))

(defn get-value [e]
  (-> e .-target .-value))

(defn model-dropdown []
  (let [values models/all
        m @model] ;; hack to force Reagent to rerender when model changes
    [:select {:on-change (fn [e]
                           (set-hydration (values (get-value e)) ""))}
     (for [key (keys values)]
       [:option 
        (if (= (values key) @model)
          {:value key :selected "selected"}
          {:value key}) 
        key])]))

(defn hydration-display []
  [:div.hydration-display
   [:div.hydration-display-title (str "hydrated " (.-count @hydration-result) " " (.. @model -prototype -tableName))]
   [records/cmp (js->clj @hydration-result :keywordize-keys true)]])

(defn hydration-input []
  [:div.hydration-input
   [:span.code "bookends.hydrate("]
   [model-dropdown]
   [:span.code ", \""]
   [:input {:type "text"
            :value @hydration
            :style { :width "400px" }
            :on-change (fn [e]
                         (reset! hydration (get-value e))
                         (do-hydration))}]
   [:span.code "\");"]])


(defn cmp []
  [:div
   [examples]
   [hydration-input]
   (when @hydration-error
     [:div.hydration-error @hydration-error])
   (when @hydration-result
     [hydration-display])])


