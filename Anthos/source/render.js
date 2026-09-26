/* Renders the brand art to production images.
   Usage:  node source/render.js
   Needs:  playwright (with chromium) and sharp — either local or global installs. */
var path = require('path');
var fs = require('fs');
var cp = require('child_process');

function load(name) {
  try { return require(name); } catch (e) {
    var root = cp.execSync('npm root -g').toString().trim();
    return require(path.join(root, name));
  }
}
var playwright = load('playwright');
var sharp = load('sharp');
var A = require('./art.js');
var CW = A.CW;

var OUT = path.join(__dirname, '..', 'site', 'assets', 'img');
fs.mkdirSync(OUT, { recursive: true });

/* [file, svg, viewBox w, viewBox h, output widths, {transparent, bg, png}] */
var jobs = [];
function job(name, svg, vw, vh, widths, opt) { jobs.push({ name: name, svg: svg, vw: vw, vh: vh, widths: widths, opt: opt || {} }); }

var lockRatio = 1563 / 160;

job('hero', A.trayArt(CW.alabaster, { objects: true, markY: 596 }), 1200, 840, [1400, 700]);
['alabaster', 'laurel', 'charcoal'].forEach(function (k) {
  job('tray-' + k, A.trayArt(CW[k]), 1200, 840, [1200, 480]);
});
job('jar-alabaster',      A.jarArt(CW.alabaster),      600, 600, [560]);
job('grinder-charcoal',   A.grinderArt(CW.charcoal),   600, 600, [560]);
job('grinder-alabaster',  A.grinderArt(CW.alabaster),  600, 600, [560]);
job('papers-alabaster',   A.papersArt(CW.alabaster),   600, 600, [560]);
job('kit-alabaster',      A.kitArt(CW.alabaster),      600, 600, [560]);
job('macro',              A.macroArt(),                760, 560, [1200], { opaque: true });
job('logo',               A.lockupSingle(CW.alabaster), 1563, 160, [1000]);

/* Open Graph card: brand-sheet header line + the hero tray, on the brand sweep. */
var tray = A.trayArt(CW.alabaster, { objects: true, markY: 596 })
  .replace('<svg viewBox="0 0 1200 840" xmlns="http://www.w3.org/2000/svg">',
           '<svg x="220" y="126" width="760" height="478" viewBox="60 70 1080 680" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">');
var og = '<svg viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">' +
  '<defs><linearGradient id="ogbg" x1="0" y1="0" x2="0.1" y2="1"><stop offset="0%" stop-color="#F4F1E9"/><stop offset="50%" stop-color="#EAE5DA"/><stop offset="100%" stop-color="#DAD3C4"/></linearGradient></defs>' +
  '<rect width="1200" height="630" fill="url(#ogbg)"/>' +
  '<g font-family="Helvetica Neue,Helvetica,Arial,Liberation Sans,sans-serif">' +
  '<text x="72" y="70" font-size="22" letter-spacing="7" fill="#2E2B23">ANTHOS ATELIER</text>' +
  '<text x="1128" y="70" font-size="14" letter-spacing="4.4" fill="#6E6656" text-anchor="end">SMOKING ACCESSORIES · MADE TO ORDER</text></g>' +
  '<line x1="72" y1="96" x2="1128" y2="96" stroke="#C6BDAA"/>' + tray + '</svg>';
job('og-image', og, 1200, 630, [1200], { png: true });

/* favicons */
var fav = A.faviconSvg();
fs.writeFileSync(path.join(OUT, '..', '..', 'favicon.svg'), fav);
job('favicon-32',        fav, 64, 64, [32],  { png: true });
job('apple-touch-icon',  fav, 64, 64, [180], { png: true, bg: '#E9E3D7' });
job('icon-192',          fav, 64, 64, [192], { png: true });
job('icon-512',          fav, 64, 64, [512], { png: true });

(async function () {
  var browser = await playwright.chromium.launch();
  var report = [];
  for (var j of jobs) {
    for (var w of j.widths) {
      var h = Math.round(w * j.vh / j.vw);
      var page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      var bg = j.opt.bg || 'transparent';
      var svg = j.svg.replace('<svg ', '<svg width="' + w + '" height="' + h + '" ');
      await page.setContent('<!doctype html><html><body style="margin:0;background:' + bg + ';overflow:hidden">' + svg + '</body></html>');
      var buf = await page.screenshot({ omitBackground: bg === 'transparent', clip: { x: 0, y: 0, width: w, height: h } });
      await page.close();
      var file, info;
      if (j.opt.png) {
        file = j.name + '.png';
        await sharp(buf).png({ compressionLevel: 9 }).toFile(path.join(OUT, file));
      } else {
        file = j.name + '-' + w + '.webp';
        await sharp(buf).webp({ quality: 80, effort: 5, alphaQuality: 95 }).toFile(path.join(OUT, file));
      }
      var size = fs.statSync(path.join(OUT, file)).size;
      report.push(file + '  ' + w + 'x' + h + '  ' + (size / 1024).toFixed(1) + ' KB');
    }
  }
  await browser.close();
  /* the icons live at site root for tidy <link> paths */
  ['favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'].forEach(function (f) {
    fs.renameSync(path.join(OUT, f), path.join(OUT, '..', '..', f));
  });
  console.log(report.join('\n'));
})().catch(function (e) { console.error(e); process.exit(1); });
