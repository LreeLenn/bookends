(defproject bookends-site "0.0.1"
  :license {:name "MIT"
            :url "http://opensource.org/licenses/MIT"
            :distribution :repo}

  :description "The documentation site for Bookends"

  :dependencies [[org.clojure/clojure "1.6.0"]
                 [org.clojure/clojurescript "0.0-2511"]
                 [org.clojure/core.async "0.1.346.0-17112a-alpha"]
                 [selmer "0.7.7"]
                 [garden "1.2.5"]
                 [jamesmacaulay/cljs-promises "0.1.0-SNAPSHOT"]
                 [reagent "0.4.3"]
                 [reagent-utils "0.1.0"]
                 [com.facebook/react "0.11.2"]
                 [ring "1.3.2"]
                 [stasis "2.2.2"]
                 [me.raynes/cegdown "0.1.1"]
                 [hiccup "1.0.5"]
                 [enlive "1.1.5"]
                 [clygments "0.1.1"]]

  :profiles {:dev {:dependencies [[ring/ring-jetty-adapter "1.1.1"]
                                  [compojure "1.1.0"]]}}

  :ring {:handler site.ring/app}

  :plugins [[lein-cljsbuild "1.0.4"]
            [lein-garden "0.1.9" :exclusions [org.clojure/clojure]]
            [lein-ring "0.8.13"]]

  :source-paths ["src/clj"]

  :garden {:builds [{:id "dev"
                     :stylesheet site.garden.core/stylesheet
                     :compiler {
                                :vendors ["webkit" "moz" "o" "ms"]
                                :output-to "resources/templates/css/site.css"
                                :pretty-print? true}}]}
  
  :cljsbuild {
              :builds [{
                        :id "dev"
                        :source-paths ["src/cljs"]
                        :compiler {:output-to "resources/templates/js/demo.site.js"
                                   :output-dir "resources/templates/js/out"
                                   :optimizations :none
                                   :pretty-print true}
                       }
                       {
                        :id "prod"
                        :source-paths ["src/cljs"]
                        :compiler {:output-to "resources/templates/js/demo.site.js"
                                   :optimizations :advanced
                                   :pretty-print false
                                   :externs [
                                             "react/externs/react.js"
                                             "resources/templates/js/knex.js"
                                             "resources/templates/js/bookshelf.js"
                                             "resources/templates/js/bookends.js"
                                            ]}
                       }]
              }

  :clean-targets ^{:protect false} ["resources/templates/js"]
  
  :aliases {"dev-server" ["do"
                          ["run" "-m" "site.copy-js"]
                          ["ring" "server-headless"]]
            
            "build-prod" ["do" 
                          ["clean"]
                          ["run" "-m" "site.copy-js"]
                          ["cljsbuild" "once" "prod"]
                          ["run" "-m" "site.ring/build-dist"]]})

