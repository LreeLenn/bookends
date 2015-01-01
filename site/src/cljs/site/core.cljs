(ns site.core
    (:require-macros [cljs.core.async.macros :refer [go]])
    (:require [site.create-db :as create-db] 
              [site.populate-db :as populate-db]
              [site.models :as models]
              [site.hydrate :refer [hydrate]]
              [reagent.core :as reagent :refer [atom]]
              [reagent.session :as session]
              [cljs-promises.async :as pasync]
              [cljs-promises.async :refer-macros [<?]]))

(enable-console-print!)
(pasync/extend-promises-as-pair-channels!)


(defn hello []
  [:div [:h2 "Bookends"]])

(defn init! []
  (go
    (<? (create-db/create))
    (<? (populate-db/populate))
    (println "hydration? " (<? (hydrate models/Player "[name]")))
    (reagent/render-component [hello] (. js/document getElementById "app"))))

(init!)

