(ns demo.knex
  (:require [cljs.core.async :refer [put! chan]]))

(def knex (js/Knex. #js {:client "websql" :debug true}))

(defn init-chan []
  (let [out (chan)
        client (.-client knex)
        Runner (.-Runner client)
        proto (.-prototype Runner)] 
    (set! (.-debug proto)
          (fn [obj] 
            (put! out {:sql (.-sql obj)
                       :bindings (.-bindings obj)})))
    out))

