# Bookends

A small library built on top of [Bookshelfjs](http://bookshelfjs.org/) which enables you to easily retrieve a complex tree of data from your SQL database.

The [website](http://city41.github.io/bookends) explains the library well, even includes an in browser demo to play with.

## About beta-ish quality so far

Bookends is coming along nicely, but you might want to wait for a 1.0.0 release before trying it in production. The API is sure to keep changing and there's probably some bugs.

## Contributing

Contributions are welcome! Please fork and do the standard pull-request routine.

### Working on the library itself

You can run `gulp test` to run all tests, unit and integration. `gulp test:integration:sqlite` will run just the integration tests. (TODO, add integration tests for Postgres and MySQL).

The library itself is written in vanilla JavaScript and is a pretty typical Node module.

### Working on the documentation website

The documentation website lives in `site/` and is written in Clojure/ClojureScript. I realize that's an odd choice for a Node module, but I couldn't resist the urge to play with ClojureScript some more.

To run a local dev version of the site: `lein dev-server`, then in another terminal: `lein cljsbuild auto dev`

To build a production version of the site: `lein build-prod`. It will dump everything into `site/dist/`. 
