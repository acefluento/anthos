/* ============================================================
   ANTHOS ATELIER — storefront behaviour
   No dependencies. Product data (name, price, thumbnail) is read from the
   data-* attributes in index.html so prices have one home.
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.ANTHOS_CONFIG || {};
  var CHECKOUT = CFG.checkout || { mode: 'reserve', links: {} };
  var CART_KEY = 'anthos:cart:v1';
  var AGE_KEY = 'anthos:age21';
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function store(op, key, val) {
    try {
      if (op === 'get') return window.localStorage.getItem(key);
      if (op === 'set') window.localStorage.setItem(key, val);
      if (op === 'del') window.localStorage.removeItem(key);
    } catch (e) { /* private mode / blocked storage — the site still works */ }
    return null;
  }
  var fmt = (function () {
    try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: CFG.currency || 'USD' }); }
    catch (e) { return { format: function (n) { return '$' + n.toFixed(2); } }; }
  })();
  function money(n) { return fmt.format(n); }

  /* ---------- dialog helpers (native <dialog>, with a plain fallback) ---------- */
  function openDialog(d) {
    if (!d || d.open) return;
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
  }
  function closeDialog(d) {
    if (!d || !d.open) return;
    if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
  }
  /* click on the backdrop closes it */
  function closeOnBackdrop(d) {
    d.addEventListener('click', function (e) {
      var r = d.getBoundingClientRect();
      var inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) closeDialog(d);
    });
  }

  /* ---------- toast ---------- */
  var tTimer, toastEl = $('#toast');
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(tTimer);
    tTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 2400);
  }

  /* ---------- 21+ gate ---------- */
  (function () {
    var gate = $('#agegate');
    if (!gate) return;
    if (CFG.ageGate === false || store('get', AGE_KEY) === '1') { gate.remove(); return; }
    $('#ageNo').href = CFG.ageGateExitUrl || 'https://www.google.com';
    gate.addEventListener('cancel', function (e) { e.preventDefault(); });   // Esc must not skip the gate
    $('#ageYes').addEventListener('click', function () {
      store('set', AGE_KEY, '1');
      closeDialog(gate);
      gate.remove();
    });
    openDialog(gate);
    $('#ageYes').focus();
  })();

  /* ---------- product lookup (HTML is the source of truth) ---------- */
  function productEl(key) { return $('[data-key="' + key + '"][data-price]'); }
  function product(key) {
    var el = productEl(key);
    return el ? { key: key, name: el.dataset.name, price: parseFloat(el.dataset.price), el: el } : null;
  }
  /* fill every "price of X" slot */
  function paintPrices() {
    $$('[data-price-of]').forEach(function (n) {
      var p = product(n.getAttribute('data-price-of'));
      if (p) n.textContent = money(p.price);
    });
  }

  /* ---------- colourway / variant pickers ---------- */
  function applyVariant(group, radio, instant) {
    var root = group.closest('[data-key]');
    var img = $(group.getAttribute('data-target'));
    var label = radio.getAttribute('data-label');
    if (root) { root.dataset.variant = radio.value; root.dataset.variantLabel = label; }

    if (img && img.getAttribute('src') !== radio.getAttribute('data-img')) {
      var swap = function () {
        img.src = radio.getAttribute('data-img');
        img.alt = radio.getAttribute('data-alt') || '';
        img.classList.remove('is-fading');
      };
      if (instant || reduceMotion || !img.classList.contains('swap')) swap();
      else { img.classList.add('is-fading'); setTimeout(swap, 180); }
    }
    var tag = group.getAttribute('data-tag'), nm = group.getAttribute('data-name');
    if (tag && $(tag)) $(tag).textContent = label;
    if (nm && $(nm)) $(nm).textContent = label + ' — ' + radio.getAttribute('data-hex');
    if (root && root.id === 'tray') {
      $$('.thumb').forEach(function (t) { t.setAttribute('aria-pressed', t.dataset.cw === radio.value ? 'true' : 'false'); });
    }
  }
  $$('.js-variant').forEach(function (group) {
    group.addEventListener('change', function (e) {
      if (e.target.matches('input[type=radio]')) applyVariant(group, e.target);
    });
  });
  $$('.thumb').forEach(function (t) {
    t.addEventListener('click', function () {
      var r = $('input[name="tray-cw"][value="' + t.dataset.cw + '"]');
      if (r && !r.checked) { r.checked = true; applyVariant($('.js-variant', $('#tray')), r); }
    });
  });

  /* ---------- quantity on the tray ---------- */
  var qty = 1;
  function syncQty() {
    $('#qVal').textContent = qty;
    var p = product('tray');
    if (p) $('#addPrice').textContent = money(p.price * qty);
  }
  $('#qMinus').addEventListener('click', function () { qty = Math.max(1, qty - 1); syncQty(); });
  $('#qPlus').addEventListener('click', function () { qty = Math.min(9, qty + 1); syncQty(); });

  /* ---------- cart ---------- */
  var cart = [];
  (function load() {
    try { cart = JSON.parse(store('get', CART_KEY) || '[]'); } catch (e) { cart = []; }
    if (!Array.isArray(cart)) cart = [];
    /* re-price from the page, drop anything the page no longer sells */
    cart = cart.filter(function (i) { return i && product(i.key) && i.qty > 0; }).map(function (i) {
      var p = product(i.key);
      i.name = p.name; i.price = p.price; i.qty = Math.min(9, Math.max(1, i.qty | 0));
      return i;
    });
  })();
  function saveCart() { store('set', CART_KEY, JSON.stringify(cart)); }
  function cartCount() { return cart.reduce(function (a, i) { return a + i.qty; }, 0); }
  function cartTotal() { return cart.reduce(function (a, i) { return a + i.price * i.qty; }, 0); }
  function lineKey(i) { return i.key + (i.variant ? ':' + i.variant : ''); }

  function addToCart(root, n) {
    var p = product(root.dataset.key);
    if (!p) return;
    var radio = $('input[type=radio]:checked', root);
    var variant = radio ? radio.value : '';
    var vLabel = radio ? radio.getAttribute('data-label') : '';
    var thumb = radio ? radio.getAttribute('data-thumb') : root.dataset.thumb;
    var hit = cart.filter(function (i) { return i.key === p.key && (i.variant || '') === variant; })[0];
    if (hit) hit.qty = Math.min(9, hit.qty + n);
    else cart.push({ key: p.key, variant: variant, vLabel: vLabel, name: p.name, price: p.price, img: thumb, qty: n });
    saveCart(); drawCart();
    toast(p.name + ' added');
    openDialog($('#drawer'));
  }

  function drawCart() {
    var count = cartCount(), total = cartTotal(), box = $('#ditems');
    $('#cartCount').textContent = count;
    $('#subtotal').textContent = money(total);
    $('#checkout').disabled = count === 0;

    var thr = CFG.freeShippingOver, ship = $('#shipNote');
    if (!count || !thr) ship.textContent = '';
    else if (total >= thr) ship.textContent = 'Complimentary shipping applied';
    else ship.textContent = 'Add ' + money(thr - total) + ' for complimentary shipping';

    box.textContent = '';
    if (!count) {
      var e = document.createElement('p'); e.className = 'empty'; e.textContent = 'Your cart is empty'; box.appendChild(e);
      return;
    }
    cart.forEach(function (i, idx) {
      var row = document.createElement('div'); row.className = 'ditem';

      var th = document.createElement('div'); th.className = 'th';
      var im = document.createElement('img'); im.src = i.img; im.alt = ''; im.width = 60; im.height = 60;
      th.appendChild(im);

      var mid = document.createElement('div');
      var nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = i.name;
      var vr = document.createElement('div'); vr.className = 'vr'; vr.textContent = i.vLabel || 'Alabaster';
      var ctl = document.createElement('div'); ctl.className = 'ctl';
      var mq = document.createElement('div'); mq.className = 'mini-qty';
      var minus = document.createElement('button'); minus.type = 'button'; minus.textContent = '–';
      minus.setAttribute('aria-label', 'Decrease quantity of ' + i.name); minus.dataset.act = 'dec'; minus.dataset.idx = idx;
      var q = document.createElement('span'); q.textContent = i.qty;
      var plus = document.createElement('button'); plus.type = 'button'; plus.textContent = '+';
      plus.setAttribute('aria-label', 'Increase quantity of ' + i.name); plus.dataset.act = 'inc'; plus.dataset.idx = idx;
      mq.appendChild(minus); mq.appendChild(q); mq.appendChild(plus);
      var rm = document.createElement('button'); rm.type = 'button'; rm.className = 'rm'; rm.textContent = 'Remove';
      rm.setAttribute('aria-label', 'Remove ' + i.name + ' from cart'); rm.dataset.act = 'rm'; rm.dataset.idx = idx;
      ctl.appendChild(mq); ctl.appendChild(rm);
      mid.appendChild(nm); mid.appendChild(vr); mid.appendChild(ctl);

      var pr = document.createElement('div'); pr.className = 'pr'; pr.textContent = money(i.price * i.qty);

      row.appendChild(th); row.appendChild(mid); row.appendChild(pr);
      box.appendChild(row);
    });
  }

  $('#ditems').addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var i = cart[parseInt(b.dataset.idx, 10)];
    if (!i) return;
    if (b.dataset.act === 'inc') i.qty = Math.min(9, i.qty + 1);
    if (b.dataset.act === 'dec') i.qty = Math.max(1, i.qty - 1);
    if (b.dataset.act === 'rm') cart.splice(cart.indexOf(i), 1);
    saveCart(); drawCart();
    if (b.dataset.act === 'rm') { if (!cart.length) $('#cartClose').focus(); }
    else { var nb = $('[data-act="' + b.dataset.act + '"][data-idx="' + b.dataset.idx + '"]', $('#ditems')); if (nb) nb.focus(); }
  });

  /* add buttons: card buttons, the tray button, and "add the kit instead" */
  document.addEventListener('click', function (e) {
    var kit = e.target.closest('[data-add-key]');
    if (kit) { var kp = productEl(kit.getAttribute('data-add-key')); if (kp) addToCart(kp, 1); return; }
    var b = e.target.closest('.js-add');
    if (!b) return;
    var root = b.closest('[data-key]');
    if (root) addToCart(root, root.id === 'tray' ? qty : 1);
  });

  var drawer = $('#drawer');
  $('#cartOpen').addEventListener('click', function () { openDialog(drawer); });
  $('#cartClose').addEventListener('click', function () { closeDialog(drawer); });
  closeOnBackdrop(drawer);

  /* ---------- checkout ---------- */
  var orderModal = $('#orderModal');
  closeOnBackdrop(orderModal);
  $$('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () { closeDialog(document.getElementById(b.getAttribute('data-close'))); });
  });

  function orderSummary() {
    return cart.map(function (i) {
      return i.name + (i.vLabel ? ' (' + i.vLabel + ')' : '') + ' × ' + i.qty + ' — ' + money(i.price * i.qty);
    }).join('\n');
  }
  function fillOrder() {
    var ul = $('#orderLines'); ul.textContent = '';
    cart.forEach(function (i) {
      var li = document.createElement('li');
      var a = document.createElement('span'); a.textContent = i.name + (i.vLabel ? ' · ' + i.vLabel : '') + ' × ' + i.qty;
      var b = document.createElement('span'); b.textContent = money(i.price * i.qty);
      li.appendChild(a); li.appendChild(b); ul.appendChild(li);
    });
    var t = document.createElement('li'); t.className = 'tot';
    var ta = document.createElement('span'); ta.textContent = 'Subtotal';
    var tb = document.createElement('span'); tb.textContent = money(cartTotal());
    t.appendChild(ta); t.appendChild(tb); ul.appendChild(t);
    $('#orderField').value = orderSummary();
    $('#orderSubtotal').value = money(cartTotal());
    $('#orderMsg').textContent = ''; $('#orderMsg').className = 'form-msg';
    $('#orderBody').hidden = false; $('#orderDone').hidden = true;
  }

  $('#checkout').addEventListener('click', function () {
    if (!cart.length) return;
    if (CHECKOUT.mode === 'links' && cart.length === 1) {
      var i = cart[0], links = CHECKOUT.links || {};
      var url = links[lineKey(i)] || links[i.key];
      if (url) { window.location.href = url; return; }
    }
    closeDialog(drawer);
    fillOrder();
    openDialog(orderModal);
  });

  /* ---------- form posting (Netlify Forms by default, or any endpoint) ---------- */
  function post(form) {
    return fetch(CFG.formEndpoint || '/', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(new FormData(form)).toString()
    }).then(function (r) { if (!r.ok) throw new Error('bad status ' + r.status); });
  }

  function busy(btn, on, label) { btn.disabled = on; if (label) btn.textContent = label; }

  var signup = $('#signupForm'), signupMsg = $('#signupMsg');
  signup.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = $('#signupEmail');
    signupMsg.className = 'form-msg';
    if (!email.value || !email.checkValidity()) { signupMsg.className = 'form-msg err'; signupMsg.textContent = 'Enter a valid email address'; email.focus(); return; }
    var btn = $('button', signup), was = btn.textContent;
    busy(btn, true, '…');
    post(signup).then(function () {
      signup.reset(); signupMsg.textContent = 'You’re on the list'; toast('Added to the list');
    }).catch(function () {
      signupMsg.className = 'form-msg err'; signupMsg.textContent = 'Couldn’t send that — please try again';
    }).then(function () { busy(btn, false, was); });
  });

  var orderForm = $('#orderForm'), orderMsg = $('#orderMsg');
  orderForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!cart.length) { orderMsg.className = 'form-msg err'; orderMsg.textContent = 'Your cart is empty'; return; }
    if (!orderForm.checkValidity()) { orderForm.reportValidity(); return; }
    $('#orderField').value = orderSummary();
    $('#orderSubtotal').value = money(cartTotal());
    var btn = $('#orderSubmit'), was = btn.textContent;
    busy(btn, true, 'Sending…');
    post(orderForm).then(function () {
      cart = []; saveCart(); drawCart(); orderForm.reset();
      $('#orderBody').hidden = true; $('#orderDone').hidden = false;
    }).catch(function () {
      orderMsg.className = 'form-msg err';
      orderMsg.textContent = 'Couldn’t send your request — please try again' + (CFG.contactEmail ? ' or write to ' + CFG.contactEmail : '');
    }).then(function () { busy(btn, false, was); });
  });

  /* ---------- hero fireball orbit ----------
     offset-path with an absolute SVG path doesn't scale with a fluid container, so the
     triangle hugging the arch's outer silhouette (two legs + peak) is recomputed from the
     arch box's actual rendered size (and on resize) instead of hardcoded, keeping the fireball
     locked to the arch at any width. Coordinates mirror the arch-svg's own viewBox (0 0 320 420):
     bottom-left leg, peak, bottom-right leg. */
  var archBox = $('.arch-orbit'), fireball = $('.fireball');
  if (archBox && fireball) {
    var setFireballOrbit = function () {
      var w = archBox.clientWidth, h = archBox.clientHeight;
      var x1 = w * (10 / 320), y1 = h * (418 / 420);
      var x2 = w * (160 / 320), y2 = h * (8 / 420);
      var x3 = w * (310 / 320), y3 = h * (418 / 420);
      fireball.style.offsetPath = "path('M " + x1 + " " + y1 + " L " + x2 + " " + y2 + " L " + x3 + " " + y3 + " Z')";
    };
    setFireballOrbit();
    window.addEventListener('resize', setFireballOrbit);
  }

  /* ---------- scramble / decrypt text reveal ---------- */
  function TextScramble(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#';
  }
  TextScramble.prototype.setText = function (newText) {
    var oldText = this.el.textContent;
    var length = Math.max(oldText.length, newText.length);
    this.queue = [];
    for (var i = 0; i < length; i++) {
      var from = oldText[i] || '';
      var to = newText[i] || '';
      var start = Math.floor(Math.random() * 30);
      var end = start + Math.floor(Math.random() * 30) + 10;
      this.queue.push({ from: from, to: to, start: start, end: end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
  };
  TextScramble.prototype.update = function () {
    var output = '', complete = 0;
    for (var i = 0, n = this.queue.length; i < n; i++) {
      var q = this.queue[i];
      if (this.frame >= q.end) {
        complete++;
        output += q.to;
      } else if (this.frame >= q.start) {
        if (!q.char || Math.random() < 0.28) { q.char = this.randomChar(); }
        output += '<span class="dchar">' + q.char + '</span>';
      } else {
        output += q.from;
      }
    }
    this.el.innerHTML = output;
    if (complete < this.queue.length) {
      this.frameRequest = requestAnimationFrame(this.update.bind(this));
      this.frame++;
    }
  };
  TextScramble.prototype.randomChar = function () {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  };

  var scrambleEls = $$('.scramble');
  if (scrambleEls.length) {
    if (reduceMotion) {
      // leave the static text exactly as authored
    } else if ('IntersectionObserver' in window) {
      var scrambleIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          new TextScramble(entry.target).setText(entry.target.textContent);
          scrambleIO.unobserve(entry.target);
        });
      }, { threshold: 0.4 });
      scrambleEls.forEach(function (el) { scrambleIO.observe(el); });
    } else {
      scrambleEls.forEach(function (el) { new TextScramble(el).setText(el.textContent); });
    }
  }

  /* ---------- small things ---------- */
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();

  $$('[data-contact]').forEach(function (a) {
    if (CFG.contactEmail) { a.href = 'mailto:' + CFG.contactEmail; a.hidden = false; }
  });
  $$('[data-if-mode]').forEach(function (n) {
    if (n.getAttribute('data-if-mode') !== CHECKOUT.mode) n.remove();
  });

  function openHashFaq() {
    var el = location.hash && document.getElementById(location.hash.slice(1));
    if (el && el.tagName === 'DETAILS') el.open = true;
  }
  window.addEventListener('hashchange', openHashFaq);

  /* ---------- go ---------- */
  paintPrices();
  syncQty();
  drawCart();
  openHashFaq();
})();
