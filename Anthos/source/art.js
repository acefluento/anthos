/* ============================================================
   ANTHOS ATELIER — drawing engine (build-time)
   Ported from the landing mockup. Monoline geometric wordmark,
   cap-height 100. The deboss is a lighting rig: recessed dark edge
   upper-left, lit edge lower-right, soft spill. Tone on tone.
   Glyph geometry, advances and tracking match brand sheets 01–06.
   ============================================================ */

var GLYPH = {
  A: '<path d="M3.25 100 L31 0 H49 L76.75 100"/><path d="M11.6 70 H68.4"/>',
  N: '<path d="M3.25 100 V0 L72.75 100 V0"/>',
  T: '<path d="M0 3.25 H72 M36 3.25 V100"/>',
  H: '<path d="M3.25 0 V100 M72.75 0 V100 M3.25 49 H72.75"/>',
  O: '<circle cx="50" cy="50" r="46.75"/>',
  S: '<path d="M64 24 C64 11 52 3.25 34 3.25 C17 3.25 4 11 4 24 C4 35 13 40.5 34 48 C55 55.5 64 61 64 74 C64 87 51 96.75 34 96.75 C16 96.75 4 89 4 76"/>',
  E: '<path d="M3.25 0 V100 M3.25 3.25 H62 M3.25 50 H54 M3.25 96.75 H62"/>',
  L: '<path d="M3.25 0 V96.75 H60"/>',
  I: '<path d="M4 0 V100"/>',
  R: '<path d="M3.25 100 V3.25 H40 C55 3.25 64 13.5 64 27.6 C64 41.8 55 52 40 52 H3.25 M36 52 L64.75 100"/>'
};
var ADV = { A: 80, N: 76, T: 72, H: 76, O: 100, S: 68, E: 62, L: 60, I: 8, R: 68 };

function word(str, track) {
  var x = 0, out = '';
  for (var i = 0; i < str.length; i++) {
    var ch = str[i];
    out += '<g transform="translate(' + x + ',0)">' + GLYPH[ch] + '</g>';
    x += ADV[ch] + track;
  }
  return { svg: out, width: x - track };
}

var UID = 0;
function uid() { return 'u' + (++UID); }

/* deboss stack — c = colourway config */
function deboss(w, c) {
  var id = uid(), m = 'm' + id, mi = 'mi' + id, f1 = 'f1' + id, f2 = 'f2' + id, W = w.width + 120;
  return '<defs>' +
    '<mask id="' + m + '" maskUnits="userSpaceOnUse" x="-40" y="-60" width="' + W + '" height="220">' +
      '<g fill="none" stroke="#fff" stroke-width="6.5">' + w.svg + '</g></mask>' +
    '<mask id="' + mi + '" maskUnits="userSpaceOnUse" x="-60" y="-80" width="' + (W + 60) + '" height="260">' +
      '<rect x="-60" y="-80" width="' + (W + 60) + '" height="260" fill="#fff"/>' +
      '<g fill="none" stroke="#000" stroke-width="6.5">' + w.svg + '</g></mask>' +
    '<filter id="' + f1 + '" x="-40%" y="-140%" width="180%" height="380%"><feGaussianBlur stdDeviation="1.5"/></filter>' +
    '<filter id="' + f2 + '" x="-40%" y="-140%" width="180%" height="380%"><feGaussianBlur stdDeviation="3.4"/></filter>' +
    '</defs>' +
    '<g fill="none" stroke="' + c.floor + '" stroke-width="6.5">' + w.svg + '</g>' +
    '<g mask="url(#' + mi + ')"><g fill="none" stroke="' + c.outer + '" stroke-width="9.5" transform="translate(1.9,2.7)" filter="url(#' + f2 + ')" opacity="' + (c.dark ? .45 : .34) + '">' + w.svg + '</g></g>' +
    '<g mask="url(#' + m + ')">' +
      '<g fill="none" stroke="' + c.edgeDark + '" stroke-width="7" transform="translate(-1.5,-1.8)" filter="url(#' + f1 + ')" opacity="' + (c.dark ? .88 : .80) + '">' + w.svg + '</g>' +
      '<g fill="none" stroke="' + c.edgeLight + '" stroke-width="7" transform="translate(1.6,2.0)" filter="url(#' + f1 + ')" opacity="' + (c.dark ? .72 : .90) + '">' + w.svg + '</g>' +
    '</g>';
}

/* place a debossed word centred at (cx,cy) spanning `span` units */
function mark(str, track, span, cx, cy, c) {
  var w = word(str, track), s = span / w.width;
  return '<g transform="translate(' + (cx - span / 2) + ',' + (cy - 50 * s) + ') scale(' + s + ')">' + deboss(w, c) + '</g>';
}

/* ---------------- colourways (brand board 06 palette) ---------------- */
var CW = {
  alabaster: {
    key: 'alabaster', name: 'Alabaster', hex: '#E9E3D7', dark: false,
    panel: ['#F6F2EA', '#EBE5D9', '#DED7C7', '#CDC4B1'],
    well: ['#F0EADE', '#E4DDCF', '#D1C8B6'],
    floor: '#E2DACA', edgeDark: '#7A715C', edgeLight: '#FFFFFF', outer: '#A89E88',
    rim: 'rgba(255,255,255,.85)', hair: '#C6BDA9', shade: '#6E6552'
  },
  laurel: {
    key: 'laurel', name: 'Laurel', hex: '#3E4632', dark: true,
    panel: ['#5A6644', '#4A5537', '#3C442E', '#2A3121'],
    well: ['#4E5A3A', '#3E4632', '#2C3422'],
    floor: '#384029', edgeDark: '#0E1308', edgeLight: '#9BAC7B', outer: '#10140B',
    rim: 'rgba(155,172,123,.55)', hair: '#2A3121', shade: '#3C3F2A'
  },
  charcoal: {
    key: 'charcoal', name: 'Charcoal', hex: '#23221F', dark: true,
    panel: ['#413F38', '#302E2A', '#242320', '#141413'],
    well: ['#38362F', '#282622', '#161614'],
    floor: '#1E1D1A', edgeDark: '#000000', edgeLight: '#837F72', outer: '#000000',
    rim: 'rgba(122,117,104,.6)', hair: '#141413', shade: '#332F25'
  }
};

/* shared gradient block */
function grads(c) {
  var id = uid();
  var g = '<defs>' +
    '<linearGradient id="pg' + id + '" x1="0.08" y1="0" x2="0.92" y2="1">' +
      '<stop offset="0%" stop-color="' + c.panel[0] + '"/><stop offset="40%" stop-color="' + c.panel[1] + '"/>' +
      '<stop offset="78%" stop-color="' + c.panel[2] + '"/><stop offset="100%" stop-color="' + c.panel[3] + '"/></linearGradient>' +
    '<linearGradient id="wg' + id + '" x1="0.1" y1="0" x2="0.9" y2="1">' +
      '<stop offset="0%" stop-color="' + c.well[0] + '"/><stop offset="52%" stop-color="' + c.well[1] + '"/>' +
      '<stop offset="100%" stop-color="' + c.well[2] + '"/></linearGradient>' +
    '<radialGradient id="rt' + id + '" cx="34%" cy="27%" r="82%">' +
      '<stop offset="0%" stop-color="' + c.panel[0] + '"/><stop offset="46%" stop-color="' + c.panel[1] + '"/>' +
      '<stop offset="100%" stop-color="' + c.panel[3] + '"/></radialGradient>' +
    '<radialGradient id="rl' + id + '" cx="33%" cy="26%" r="84%">' +
      '<stop offset="0%" stop-color="' + c.well[0] + '"/><stop offset="50%" stop-color="' + c.well[1] + '"/>' +
      '<stop offset="100%" stop-color="' + c.well[2] + '"/></radialGradient>' +
    '<linearGradient id="rim' + id + '" x1="0.15" y1="0" x2="0.85" y2="1">' +
      '<stop offset="0%" stop-color="' + c.rim + '"/><stop offset="45%" stop-color="rgba(255,255,255,.08)"/>' +
      '<stop offset="100%" stop-color="rgba(0,0,0,.28)"/></linearGradient>' +
    '<radialGradient id="sh' + id + '" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="#fff" stop-opacity="' + (c.dark ? .14 : .46) + '"/>' +
      '<stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
    '<filter id="bs' + id + '" x="-45%" y="-45%" width="190%" height="190%"><feGaussianBlur stdDeviation="22"/></filter>' +
    '<filter id="bm' + id + '" x="-45%" y="-45%" width="190%" height="190%"><feGaussianBlur stdDeviation="8"/></filter>' +
    '<filter id="gn' + id + '"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>' +
  '</defs>';
  return {
    defs: g, panel: 'url(#pg' + id + ')', well: 'url(#wg' + id + ')', rtop: 'url(#rt' + id + ')',
    rlid: 'url(#rl' + id + ')', rim: 'url(#rim' + id + ')', sheen: 'url(#sh' + id + ')',
    blur: 'url(#bs' + id + ')', blurS: 'url(#bm' + id + ')', grain: 'url(#gn' + id + ')'
  };
}

/* ---------------- THE ROLLING TRAY ---------------- */
function trayArt(c, opts) {
  opts = opts || {};
  var g = grads(c);
  var s = '<svg viewBox="0 0 1200 840" xmlns="http://www.w3.org/2000/svg">' + g.defs;
  s += '<rect x="86" y="104" width="1032" height="648" rx="26" fill="' + c.shade + '" opacity=".34" filter="' + g.blur + '"/>';
  s += '<rect x="70" y="80" width="1060" height="660" rx="26" fill="' + g.panel + '"/>';
  s += '<rect x="71.5" y="81.5" width="1057" height="657" rx="25" fill="none" stroke="' + g.rim + '" stroke-width="2.6"/>';
  s += '<rect x="116" y="126" width="968" height="568" rx="14" fill="' + g.well + '"/>';
  s += '<rect x="116" y="126" width="968" height="568" rx="14" fill="none" stroke="' + c.edgeDark + '" stroke-width="9" opacity="' + (c.dark ? .5 : .22) + '" filter="' + g.blurS + '"/>';
  s += '<rect x="117" y="127" width="966" height="566" rx="13" fill="none" stroke="' + g.rim + '" stroke-width="1.4" opacity=".55"/>';
  s += '<ellipse cx="380" cy="270" rx="400" ry="210" fill="' + g.sheen + '"/>';
  s += mark('ANTHOS', 70, 430, 600, opts.markY || 410, c);
  if (opts.objects) {
    var cg = grads(CW.charcoal);
    s += cg.defs;
    /* stash jar sitting on the tray */
    s += '<ellipse cx="358" cy="318" rx="114" ry="112" fill="#000" opacity=".30" filter="' + g.blurS + '"/>';
    s += '<circle cx="348" cy="304" r="112" fill="' + g.rtop + '"/>';
    s += '<circle cx="348" cy="304" r="111" fill="none" stroke="' + g.rim + '" stroke-width="1.8"/>';
    s += '<circle cx="348" cy="304" r="105" fill="' + g.rlid + '"/>';
    s += '<ellipse cx="310" cy="262" rx="80" ry="56" fill="' + g.sheen + '"/>';
    s += mark('ANTHOS', 70, 168, 348, 304, c);
    /* grinder, charcoal against the bone tray */
    s += '<ellipse cx="662" cy="326" rx="90" ry="88" fill="#000" opacity=".30" filter="' + g.blurS + '"/>';
    s += '<circle cx="654" cy="312" r="88" fill="' + cg.rtop + '"/>';
    s += '<circle cx="654" cy="312" r="81" fill="none" stroke="#000" stroke-width="12" opacity=".5" stroke-dasharray="3.4 6.6"/>';
    s += '<circle cx="654" cy="312" r="74" fill="' + cg.rlid + '"/>';
    s += '<circle cx="654" cy="312" r="87" fill="none" stroke="rgba(122,117,104,.5)" stroke-width="1.5"/>';
    s += mark('ANTHOS', 70, 112, 654, 312, CW.charcoal);
  }
  s += '<rect width="1200" height="840" filter="' + g.grain + '" opacity=".05" style="mix-blend-mode:overlay"/>';
  return s + '</svg>';
}

/* ---------------- OTHER OBJECTS ---------------- */
function jarArt(c) {
  var g = grads(c);
  return '<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">' + g.defs +
    '<ellipse cx="310" cy="312" rx="232" ry="230" fill="' + c.shade + '" opacity=".28" filter="' + g.blur + '"/>' +
    '<circle cx="300" cy="300" r="230" fill="' + g.rtop + '"/>' +
    '<circle cx="300" cy="300" r="229" fill="none" stroke="' + g.rim + '" stroke-width="2.2"/>' +
    '<circle cx="300" cy="300" r="222" fill="none" stroke="' + c.edgeDark + '" stroke-width="10" opacity="' + (c.dark ? .45 : .24) + '" filter="' + g.blurS + '"/>' +
    '<circle cx="300" cy="300" r="214" fill="' + g.rlid + '"/>' +
    '<ellipse cx="212" cy="212" rx="164" ry="116" fill="' + g.sheen + '"/>' +
    mark('ANTHOS', 70, 348, 300, 300, c) +
    '<rect width="600" height="600" filter="' + g.grain + '" opacity=".05" style="mix-blend-mode:overlay"/></svg>';
}

function grinderArt(c) {
  var g = grads(c);
  return '<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">' + g.defs +
    '<ellipse cx="310" cy="312" rx="232" ry="230" fill="' + c.shade + '" opacity=".28" filter="' + g.blur + '"/>' +
    '<circle cx="300" cy="300" r="230" fill="' + g.rtop + '"/>' +
    '<circle cx="300" cy="300" r="229" fill="none" stroke="' + g.rim + '" stroke-width="2.2"/>' +
    '<circle cx="300" cy="300" r="214" fill="none" stroke="' + c.edgeDark + '" stroke-width="30" opacity="' + (c.dark ? .55 : .36) + '" stroke-dasharray="4.2 8.5"/>' +
    '<circle cx="300" cy="300" r="214" fill="none" stroke="' + (c.dark ? '#8E8A7C' : '#FFFFFF') + '" stroke-width="30" opacity=".26" stroke-dasharray="4.2 8.5" stroke-dashoffset="6.4"/>' +
    '<circle cx="300" cy="300" r="192" fill="none" stroke="' + c.edgeDark + '" stroke-width="10" opacity="' + (c.dark ? .45 : .26) + '" filter="' + g.blurS + '"/>' +
    '<circle cx="300" cy="300" r="185" fill="' + g.rlid + '"/>' +
    '<ellipse cx="228" cy="228" rx="140" ry="98" fill="' + g.sheen + '"/>' +
    mark('ANTHOS', 70, 300, 300, 300, c) +
    '<rect width="600" height="600" filter="' + g.grain + '" opacity=".05" style="mix-blend-mode:overlay"/></svg>';
}

function papersArt(c) {
  var g = grads(c);
  return '<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">' + g.defs +
    '<rect x="196" y="126" width="220" height="360" rx="12" fill="' + c.shade + '" opacity=".28" filter="' + g.blur + '"/>' +
    '<rect x="186" y="112" width="220" height="360" rx="12" fill="' + g.panel + '"/>' +
    '<rect x="187.5" y="113.5" width="217" height="357" rx="11" fill="none" stroke="' + g.rim + '" stroke-width="1.8"/>' +
    '<g stroke="' + c.hair + '" stroke-width="1.4" opacity=".5"><line x1="186" y1="132" x2="406" y2="132"/><line x1="186" y1="146" x2="406" y2="146"/><line x1="186" y1="160" x2="406" y2="160"/></g>' +
    '<ellipse cx="250" cy="210" rx="130" ry="130" fill="' + g.sheen + '"/>' +
    mark('ANTHOS', 70, 148, 296, 330, c) +
    '<rect width="600" height="600" filter="' + g.grain + '" opacity=".05" style="mix-blend-mode:overlay"/></svg>';
}

function kitArt(c) {
  var g = grads(c), lg = grads(CW.laurel), cg = grads(CW.charcoal);
  var s = '<svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">' + g.defs + lg.defs + cg.defs;
  s += '<rect x="76" y="126" width="460" height="360" rx="16" fill="' + c.shade + '" opacity=".30" filter="' + g.blur + '"/>';
  s += '<rect x="66" y="112" width="460" height="360" rx="16" fill="' + g.panel + '"/>';
  s += '<rect x="67.5" y="113.5" width="457" height="357" rx="15" fill="none" stroke="' + g.rim + '" stroke-width="2"/>';
  s += '<rect x="86" y="132" width="420" height="320" rx="8" fill="' + lg.well + '"/>';
  s += '<rect x="86" y="132" width="420" height="320" rx="8" fill="none" stroke="#000" stroke-width="16" opacity=".42" filter="' + lg.blurS + '"/>';
  /* jar */
  s += '<circle cx="176" cy="216" r="66" fill="' + g.rtop + '"/><circle cx="176" cy="216" r="62" fill="' + g.rlid + '"/>';
  s += '<circle cx="176" cy="216" r="65" fill="none" stroke="' + g.rim + '" stroke-width="1.4"/>';
  s += mark('ANTHOS', 70, 100, 176, 216, c);
  /* grinder */
  s += '<circle cx="330" cy="216" r="54" fill="' + cg.rtop + '"/>';
  s += '<circle cx="330" cy="216" r="49" fill="none" stroke="#000" stroke-width="9" opacity=".5" stroke-dasharray="2.8 5.4"/>';
  s += '<circle cx="330" cy="216" r="44" fill="' + cg.rlid + '"/>';
  /* tray */
  s += '<rect x="112" y="318" width="250" height="112" rx="8" fill="' + g.panel + '"/>';
  s += '<rect x="113" y="319" width="248" height="110" rx="7" fill="none" stroke="' + g.rim + '" stroke-width="1.4"/>';
  s += '<rect x="124" y="330" width="226" height="88" rx="5" fill="#000" opacity=".05"/>';
  s += mark('ANTHOS', 70, 132, 237, 374, c);
  /* sleeve */
  s += '<rect x="398" y="300" width="60" height="146" rx="8" fill="' + g.panel + '"/>';
  s += '<rect x="399" y="301" width="58" height="144" rx="7" fill="none" stroke="' + g.rim + '" stroke-width="1.3"/>';
  s += '<rect width="600" height="600" filter="' + g.grain + '" opacity=".05" style="mix-blend-mode:overlay"/>';
  return s + '</svg>';
}

/* macro detail — big single letters, extreme close-up of the deboss */
function macroArt() {
  var c = CW.alabaster, g = grads(c), w = word('ANTHOS', 70), s2 = 1500 / w.width;
  return '<svg viewBox="0 0 760 560" xmlns="http://www.w3.org/2000/svg">' + g.defs +
    '<rect width="760" height="560" fill="' + g.panel + '"/>' +
    '<ellipse cx="180" cy="120" rx="520" ry="360" fill="' + g.sheen + '"/>' +
    '<g transform="translate(-330,180) scale(' + s2 + ')">' + deboss(w, c) + '</g>' +
    '<rect width="760" height="560" filter="' + g.grain + '" opacity=".06" style="mix-blend-mode:overlay"/></svg>';
}

/* ---------------- brand lockups ----------------
   Single line = brand sheet 02: ANTHOS and ATELIER at ONE scale, +0.44em track,
   ATELIER offset 827 glyph units from ANTHOS (470 -> 933 at 0.56 scale on the sheet).
   Stacked = brand sheet 01: ATELIER at wide track (123.5) at 0.6 scale so both words
   share one measure. */
function lockupSingle(c) {
  c = c || CW.alabaster;
  var a = word('ANTHOS', 44), t = word('ATELIER', 44), off = 827, W = off + t.width;
  return '<svg viewBox="-30 -30 ' + (W + 60) + ' 160" xmlns="http://www.w3.org/2000/svg">' +
    deboss(a, c) + '<g transform="translate(' + off + ',0)">' + deboss(t, c) + '</g></svg>';
}
function lockupStacked(c) {
  c = c || CW.alabaster;
  var a = word('ANTHOS', 44), t = word('ATELIER', 123.5);
  return '<svg viewBox="-30 -30 ' + (a.width + 60) + ' 240" xmlns="http://www.w3.org/2000/svg">' +
    '<g>' + deboss(a, c) + '</g><g transform="translate(0,155) scale(0.6)">' + deboss(t, c) + '</g></svg>';
}

/* favicon — the A from the wordmark, ink on alabaster. A favicon has to be legible
   at 16px, so it is the one place the mark is not tone-on-tone. */
function faviconSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
    '<rect width="64" height="64" rx="13" fill="#E9E3D7"/>' +
    '<g transform="translate(13.6 9) scale(.46)" fill="none" stroke="#23221F" stroke-width="10.5" stroke-linejoin="miter" stroke-linecap="butt">' +
    '<path d="M3.25 100 L31 0 H49 L76.75 100"/><path d="M11.6 70 H68.4"/></g></svg>';
}

module.exports = {
  CW: CW, word: word, deboss: deboss, mark: mark, trayArt: trayArt, jarArt: jarArt,
  grinderArt: grinderArt, papersArt: papersArt, kitArt: kitArt, macroArt: macroArt,
  lockupSingle: lockupSingle, lockupStacked: lockupStacked, faviconSvg: faviconSvg
};
