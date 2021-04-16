const gulp = require("gulp");
const { src, dest, watch } = require("gulp");
const sass = require("gulp-sass");
const sassGlob = require("gulp-sass-glob");
const plumber = require('gulp-plumber');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const notify = require('gulp-notify'); 
const ejs = require('gulp-ejs');
const rename = require('gulp-rename'); 
const htmlmin = require('gulp-htmlmin');
const browserSync = require('browser-sync').create(); 
const cleanCss = require('gulp-clean-css'); 
const del = require('del'); 
const babel = require('gulp-babel');



//取得元、出力先のパス
const pathOrigin = {
  dest: './src',
  dev: './src'
}

const paths = {
  html2: {
    src: pathOrigin.dev + '/**/*.html',
    tempSrc: pathOrigin.dev + '/**/_*.html',
    dest:  pathOrigin.dest,
  },
  html: {
    src: pathOrigin.dev + '/views/**/*.ejs',
    tempSrc: pathOrigin.dev + '/views/**/_*.ejs',
    dest:  pathOrigin.dest,
    map: '/map',
  },
  styles: {
    src: pathOrigin.dev + '/scss/**/*.scss',
    dest: pathOrigin.dest + '/assets/css/',
    tempSrc: pathOrigin.dev + '/scss/**/_*.scss',
    map: '/map',
    clearmap: pathOrigin.dest + '/assets/css/map',
  },
  scripts: {
    src: pathOrigin.dev + '/assets/js/**/*.js',
    dest: pathOrigin.dest + '/assets/js-babel/',
    map: '/map',
    clearmap: pathOrigin.dest + '/map',
  },
  images: {
    src: pathOrigin.dev + '/assets/img/**/*.{jpg,jpeg,png,svg,gif}',
    dest: pathOrigin.dest + '/assets/img/',
  }
}
const srcpathAll = [paths.scripts.src, paths.html.src, paths.html2.src, paths.html.tempSrc, paths.styles.src, paths.styles.tempSrc];

// 新：JS
function compileScripts() {
  return gulp
    .src([paths.scripts.src])
    .pipe(babel({
      presets: ['@babel/preset-env']
    }))
    .pipe(dest(paths.scripts.dest));
}

// 新：HTML
function compileHtml() {
  return gulp
    .src([paths.html.src, '!' + paths.html.tempSrc], {since: gulp.lastRun(compileEjs) })
    // .pipe(plumber({
    //   errorHandler: notify.onError('Error: <%= error.message %>')
    // }))
    // .pipe(ejs())
    // .pipe(rename({extname:'.html'}))
    // .pipe(htmlmin({
    //   collapseWhitespace : false, //余白を削除
    //   removeComments : true,　//コメントを削除
    //   removeRedundantAttributes: true //default値の属性を削除
    // }))
    .pipe(dest(paths.html.dest));
}


// EJS
function compileEjs() {
  return gulp
    .src([paths.html.src, '!' + paths.html.tempSrc], {since: gulp.lastRun(compileEjs) })
    .pipe(plumber({
      errorHandler: notify.onError('Error: <%= error.message %>')
    }))
    .pipe(ejs())
    .pipe(rename({extname:'.html'}))
    .pipe(htmlmin({
      collapseWhitespace : false, //余白を削除
      removeComments : true,　//コメントを削除
      removeRedundantAttributes: true //default値の属性を削除
    }))
    .pipe(dest(paths.html.dest));
}

// SASS
const compileSass = () =>
  // CASE１：出力を分ける場合
  // src("src/scss/*.scss")
  // CASE２：style.cssに集約する場合

  // 元
  // src(paths.styles.src,{ sourcemaps: true, since: gulp.lastRun(compileSass)})
  // 変更後：scssファイルを全て更新する
  src(paths.styles.src,{ sourcemaps: true, compileSass})

.pipe(sassGlob()) // Sassの@importにおけるglobを有効にする
.pipe(
  sass({
    outputStyle: "compact" //expanded, nested, campact, compressedから選択
  })
)
.pipe(
  postcss([
    autoprefixer({
      // 指定の内容はpackage.jsonに記入している
      cascade: false,
      grid: true
    })
  ])
)
// .pipe(cleanCss())
.pipe(dest(paths.styles.dest,{
  // sourcemaps: paths.styles.map
}));



const watchSassFiles = () => watch(paths.styles.src, compileSass);
const watchEjsFiles  = () => watch(paths.html.src, compileEjs);
const watchall = () => watch(srcpathAll, browserReload);

// npx gulpというコマンドを実行した時、watchSassFilesが実行されるようにします
// exports.default = gulp.series(
//   gulp.parallel(watchSassFiles,watchEjsFiles)
//   // gulp.series(watchSassFiles,watchEjsFiles)
// );



// サーバーを立ち上げる
function destServer(done) {
  browserSync.init({
      server: {
          baseDir: pathOrigin.dest,
          index  : "index.html"
      },
      open: 'external',
      reloadOnRestart: true,
  });
  done();
}

// ブラウザのリロード
function browserReload(done) {
  browserSync.reload();
  done();
  console.log(('reload done'));
}


exports.default = gulp.series(
  gulp.series(destServer),
  gulp.parallel(watchSassFiles, watchEjsFiles,watchall)
);


// css.map削除
function clearMap() {
  return del([paths.styles.clearmap]);
}


// babel
gulp.task('babel', () => {
    return gulp.src(paths.scripts.src)
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        .pipe(dest(paths.scripts.dest));
});