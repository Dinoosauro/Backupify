// Output directory: dist/website
const uglify = require("uglify-js");
const fs = require("fs");
const cleancss = require("clean-css");
const htmlminify = require('html-minifier');
const browserify = require("browserify");
if (fs.existsSync("dist")) fs.rmSync("dist", {recursive: true});
function checkDist(e) {
    if (!fs.existsSync(`dist/${e.substring(0, e.lastIndexOf("/"))}`)) fs.mkdirSync(`dist/${e.substring(0, e.lastIndexOf("/"))}`, {recursive: true});
}
let JSPath = ["js/addSongs.js", "js/commonUsage.js", "js/createPlaylists.js", "js/fetchPlaylist.js", "js/fetchPlaylistDetails.js", "js/fetchUserLib.js", "js/getUserId.js", "website/commonWeb.js", "web.js"];
JSPath.forEach(e => {
    checkDist(e);
    fs.writeFileSync(`dist/${e}`, uglify.minify(fs.readFileSync(e, "utf-8"), {mangle: {toplevel: e !== "website/commonWeb.js"}}).code);
});
let finalJs = browserify();
finalJs.add("dist/web.js");
let output = fs.createWriteStream("dist/website/bundle.js");
let pipe = finalJs.bundle().pipe(output);
pipe.on("finish", () => {
    fs.rmSync("dist/web.js");
    fs.rmSync("dist/js", {recursive: true});
})
let HTMLPath = ["website/index.html", "website/next.html"];
HTMLPath.forEach(e => {
    checkDist(e);
    fs.writeFileSync(`dist/${e}`, htmlminify.minify(fs.readFileSync(e, "utf-8"), {minifyJS: true, minifyCSS: true, collapseWhitespace: true, conservativeCollapse: true}))
})
let CSSPath = ["website/style.css"];
CSSPath.forEach(e => {
    checkDist(e);
    fs.writeFileSync(`dist/${e}`, new cleancss().minify(fs.readFileSync(e, "utf-8")).styles)
})
let assets = ["website/spotiLogo/logo.png"];
assets.forEach(e => {
    checkDist(e);
    fs.copyFileSync(e, `dist/${e}`);
})