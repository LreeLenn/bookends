(ns demo.core
    (:require-macros [cljs.core.async.macros :refer [go]])
    (:require [demo.create-db :as create-db] 
              [demo.populate-db :as populate-db]
              [demo.components.db-schema :as db-schema]
              [demo.components.sandbox :as sandbox]
              [reagent.core :as reagent]
              [cljs-promises.async :as pasync]
              [cljs-promises.async :refer-macros [<?]]))

(enable-console-print!)

(def has-index-db (not (not (.-openDatabase js/window))))

(defn no-index-db-warning []
  [:div.center
   [:div.alert.alert-danger
    [:h3 "IndexedDB Needed"]
    [:p "IndexedDB gives browsers access to a SQLite-esque database, which the demo needs to function. Unfortunately only webkit browsers these days have IndexedDB, if you come back with Chrome, Safari or Opera you'll be able to try the demo."]]])

(defn container []
  (if has-index-db
    [:div
     [db-schema/cmp]
     [sandbox/cmp]]
    [no-index-db-warning]))

(defn init! []
  (go
    (when has-index-db
      (<? (create-db/create))
      (<? (populate-db/populate)))
    (reagent/render-component [container] 
                              (. js/document getElementById "app"))))

(init!)

