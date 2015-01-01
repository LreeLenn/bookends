(ns site.hydrate
  (:require [cljs-promises.core :as p]))

(def bookends (js/Bookends.))

(defn hydrate
  ([Model hydration]
   (hydrate Model #js {} hydration))
  ([Model options hydration]
   (p/resolve (. bookends hydrate Model options hydration))))
