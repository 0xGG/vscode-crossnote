const gulp = require("gulp");

gulp.task("copy-css-files", function (cb) {
  gulp
    .src(["./node_modules/vickymd/theme/**/*"])
    .pipe(gulp.dest("./public/styles/"));
  cb();
});
