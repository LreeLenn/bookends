var gulp = require('gulp');
var mocha = require('gulp-mocha');
var shell = require('gulp-shell');
var jshint = require('gulp-jshint');
var browserify = require('browserify');
var source = require('vinyl-source-stream');

gulp.task('lint', function() {
  return gulp.src(['./lib/**/*.js', './test/**/*.js'])
  .pipe(jshint({ loopfunc: true, expr: true }))
  .pipe(jshint.reporter('default'))
  .pipe(jshint.reporter('fail'));
});

gulp.task('test:unit', ['lint'], function() {
  return gulp.src([
    './test/helpers/*.js',
    './test/unit/**/*.js'
  ])
  .pipe(mocha());
});

gulp.task('delete:sqlite', shell.task(['rm -f ./sqlite-integration-spec.db']));

gulp.task('test:integration:sqlite', ['delete:sqlite'], function() {
  return gulp.src([
    './test/helpers/*.js',
    './test/integration/sqlite*.js'
  ])
  .pipe(mocha());
});

gulp.task('test', [
  'test:unit',
  'test:integration:sqlite'
]);

gulp.task('build:browser', function() {
  return browserify('./browser.js')
    .transform('brfs')
    .bundle()
    .pipe(source('bookends.js'))
    .pipe(gulp.dest('./browser/'));
});

gulp.task('build', ['test', 'build:browser']);
