(ns site.ring
  (:require [clojure.java.io :as io]
            [hiccup.page :refer [html5]]
            [me.raynes.cegdown :as md]
            [selmer.parser :refer [render-file]]
            [clygments.core :as pygments]
            [net.cgrand.enlive-html :as enlive]
            [stasis.core :as stasis]))

(def content-types {"js" "text/javascript"
                    "css" "text/css"
                    "svg" "image/svg+xml"
                    "html" "text/html"})

(defn wrap-content-type [handler]
  (fn [request]
    (let [response (handler request)
          uri (:uri request)
          ext (re-find #"\w+$" uri)]
      (if-let [content-type (content-types ext)] 
        (assoc response :headers { "Content-Type" content-type })
        response))))


(defn- extract-code
  [highlighted]
  (-> highlighted
      java.io.StringReader.
      enlive/html-resource
      (enlive/select [:pre])
      first
      :content))

(defn- highlight [node]
  (let [code (->> node :content (apply str))
        lang (->> node :attrs :class keyword)]
    (assoc node :content (-> code
                             (pygments/highlight lang :html)
                             extract-code))))

(defn highlight-code-blocks [page]
  (enlive/sniptest page
            [:pre :code] highlight
            [:pre :code] #(assoc-in % [:attrs :class] "codehilite")))

(defn menu-entry [href title current-href]
  [:li {:class (if (= href current-href) "active" "")}
     [:a {:href href} title]])

(defn layout-partial ([page current-href]
                   (layout-partial page current-href false))
  ([page current-href add-container]
   (highlight-code-blocks
     (html5
       [:head
        [:meta {:charset "utf-8"}]
        [:title "Bookends"]
        [:link {:rel "stylesheet" :href "css/syntax.css"}]
        [:link {:rel "stylesheet" :href "css/bootstrap.min.css"}]
        [:link {:rel "stylesheet" :href "css/freelancer.css"}]
        [:link {:rel "stylesheet" :href "css/site.css"}]]
       [:body
        [:nav.navbar.navbar-default
         {:role "navigation"}
         [:div.container
          [:div.navbar-header
           [:a.navbar-brand {:href "index.html"} "Bookends"]]
          [:ul.nav.navbar-nav
            (menu-entry "demo.html" "Live Demo" current-href)
            (menu-entry "getting-started.html" "Getting Started" current-href)
            (menu-entry "docs.html" "Docs" current-href)
            (menu-entry "https://github.com/city41/bookends" "GitHub" current-href)]]]
        [:div
         (if add-container
           [:div.container
            [:div.row
             [:div.col-offset-sm-1.col-sm-10.page
              page]]]
           page)]]))))

(defn get-partial 
  ([page] 
   (get-partial page true))
  ([page is-dev]
   (fn [request]
     (layout-partial
       (render-file (str "templates/" page ".html") {:dev is-dev})
       (str page ".html")))))

(defn get-markdown-page [page is-dev]
  (fn [request]
    (layout-partial
      (md/to-html (slurp (str "resources/templates/" page ".md")) [:all])
      (str page ".html")
      true)))
  
(defn get-page [page is-dev]
  (fn [request]
    (render-file (str "templates/" page ".html") {:dev is-dev})))

(defn get-partials 
  ([] 
   (get-partials true))
  ([is-dev]
   (merge (stasis/slurp-directory "resources/templates" #".*\.(js|css|svg)$")
          {"/index.html" (get-partial "index" is-dev)
           "/demo.html"  (get-partial "demo" is-dev)
           "/getting-started.html" (get-markdown-page "getting-started" is-dev) 
           "/docs.html" (get-page "docs" is-dev)})))

(def app
 (-> (stasis/serve-pages get-partials)
     (wrap-content-type)))

(def dist-dir "dist")

(defn build-dist []
  (stasis/empty-directory! dist-dir)
  (stasis/export-pages (get-partials false) dist-dir))
