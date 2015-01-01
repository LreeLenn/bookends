(ns demo.components.expander)

(defn cmp [collapsed-atom noun]
  [:a.expander {:on-click #(swap! collapsed-atom not) }
    "(" (if @collapsed-atom "show" "hide") " " noun ")"])

