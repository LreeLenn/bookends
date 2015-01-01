(defproject bookends-site "0.0.1"
  :license {:name "MIT"
            :url "http://opensource.org/licenses/MIT"
            :distribution :repo}

  :description "The documentation site for Bookends"

  :dependencies [[org.clojure/clojure "1.6.0"]
                 [org.clojure/clojurescript "0.0-2511"]
                 [org.clojure/core.async "0.1.346.0-17112a-alpha"]
                 [selmer "0.7.7"]
                 [garden "1.1.8"]
                 [jamesmacaulay/cljs-promises "0.1.0-SNAPSHOT"]
                 [reagent "0.4.3"]
                 [reagent-utils "0.1.0"]
                 [com.facebook/react "0.11.2"]]

  :profiles {:dev {:dependencies [[ring/ring-jetty-adapter "1.1.1"]
                                  [compojure "1.1.0"]]}}

  :main server.core

  :plugins [[lein-cljsbuild "1.0.4"]
            [lein-garden "0.1.9" :exclusions [org.clojure/clojure]]]

  :source-paths ["src/clj"]

  :garden {:builds [{:id "prod"
                     :stylesheet mario.style.desktop.main/stylesheet
                     :compiler {
                                :vendors ["webkit" "moz" "o" "ms"]
                                :output-to "public/css/mario.css"
                                :pretty-print? false}}
                    {:id "desktop"
                     :stylesheet mario.style.desktop.main/stylesheet
                     :compiler {
                                :vendors ["webkit" "moz" "o" "ms"]
                                :output-to "public/css/mario.css"
                                :prety-print? true}}]}
  
  :cljsbuild {
              :builds [{
                        :id "dev"
                        :source-paths ["src/cljs"]
                        :compiler {:output-to "dist/js/bookends.site.js"
                                   :output-dir "dist/js/out"
                                   :optimizations :none
                                   :pretty-print true}
                       }
                       {
                        :id "prod"
                        :source-paths ["src/cljs"]
                        :compiler {:output-to "dist/js/bookends.site.js"
                                   :optimizations :advanced
                                   :pretty-print false
                                   :externs [
                                             "react/externs/react.js"
                                             "dist/js/knex.js"
                                             "dist/js/bookshelf.js"
                                             "dist/js/bookends.js"
                                            ]}
                       }]
              }
  
  :aliases {"build-dev"  ["do"
                              ["run" "-m" "site.build-html" "debug"]
                              ["run" "-m" "site.copy-js"]
                              ["cljsbuild" "auto" "dev"]]
            "build-prod" ["do" 
                              ["run" "-m" "site.build-html"]
                              ["run" "-m" "site.copy-js"]
                              ["cljsbuild" "once" "prod"]]})

