(ns demo.hydrate
  (:require [cljs-promises.core :as p]
            [cljs-promises.async :as pasync]))

(def bookends (js/Bookends.))

(defn hydrate
  ([Model hydration]
   (hydrate Model #js {} hydration))
  ([Model options hydration]
   (pasync/pair-port (. bookends hydrate Model options hydration))))
