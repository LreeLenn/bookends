(ns demo.data)

(def authors #js [
#js { :id 1111  :last_name "Denham"       :first_name "Ariel" }
#js { :id 1212  :last_name "Worsley"      :first_name "John" }
#js { :id 15990 :last_name "Bourgeois"    :first_name "Paulette" }
#js { :id 25041 :last_name "Bianco"       :first_name "Margery Williams" }
#js { :id 16    :last_name "Alcott"       :first_name "Louisa May" }
#js { :id 4156  :last_name "King"         :first_name "Stephen" }
#js { :id 1866  :last_name "Herbert"      :first_name "Frank" }
#js { :id 1644  :last_name "Hogarth"      :first_name "Burne" }
#js { :id 2031  :last_name "Brown"        :first_name "Margaret Wise" }
#js { :id 115   :last_name "Poe"          :first_name "Edgar Allen" }
#js { :id 7805  :last_name "Lutz"         :first_name "Mark" }
#js { :id 7806  :last_name "Christiansen" :first_name "Tom" }
#js { :id 1533  :last_name "Brautigan"    :first_name "Richard" }
#js { :id 1717  :last_name "Brite"        :first_name "Poppy Z." }
#js { :id 2112  :last_name "Gorey"        :first_name "Edward" }
#js { :id 2001  :last_name "Clarke"       :first_name "Arthur C." }
#js { :id 1213  :last_name "Brookins"     :first_name "Andrew" }
#js { :id 25043 :last_name "Simon"        :first_name "Neil" }
#js { :id 1809  :last_name "Geisel"       :first_name "Theodor Seuss" }])

(def books #js [
#js { :id 7808 :title "The Shining"                  :author_id 4156  :subject_id 9 }
#js { :id 4513  :title "Dune"                        :author_id 1866  :subject_id 15 }
#js { :id 4267  :title "2001: A Space Odyssey"       :author_id 2001  :subject_id 15 }
#js { :id 1608  :title "The Cat in the Hat"          :author_id 1809  :subject_id 2 }
#js { :id 1590  :title "Bartholomew and the Oobleck" :author_id 1809  :subject_id 2 }
#js { :id 25908 :title "Franklin in the Dark"        :author_id 15990 :subject_id 2 }
#js { :id 1501  :title "Goodnight Moon"              :author_id 2031  :subject_id 2 }
#js { :id 190   :title "Little Women"                :author_id 16    :subject_id 6 }
#js { :id 1234  :title "The Velveteen Rabbit"        :author_id 25041 :subject_id 3 }
#js { :id 2038  :title "Dynamic Anatomy"             :author_id 1644  :subject_id 0 }
#js { :id 156   :title "The Tell-Tale Heart"         :author_id 115   :subject_id 9 }
#js { :id 41473 :title "Programming Python"          :author_id 7805  :subject_id 4 }
#js { :id 41477 :title "Learning Python"             :author_id 7805  :subject_id 4 }
#js { :id 41478 :title "Perl Cookbook"               :author_id 7806  :subject_id 4 }
#js { :id 41472 :title "Practical PostgreSQL"        :author_id 1212  :subject_id 4 }])

(def subjects #js [
#js { :id 0  :subject "Arts"             }
#js { :id 1  :subject "Business"         }
#js { :id 2  :subject "Children's Books" }
#js { :id 3  :subject "Classics"         }
#js { :id 4  :subject "Computers"        }
#js { :id 5  :subject "Cooking"          }
#js { :id 6  :subject "Drama"            }
#js { :id 7  :subject "Entertainment"    }
#js { :id 8  :subject "History"          }
#js { :id 9  :subject "Horror"           }
#js { :id 10 :subject "Mystery"          }
#js { :id 11 :subject "Poetry"           }
#js { :id 12 :subject "Religion"         }
#js { :id 13 :subject "Romance"          }
#js { :id 14 :subject "Science"          }
#js { :id 15 :subject "Science Fiction"  }])
