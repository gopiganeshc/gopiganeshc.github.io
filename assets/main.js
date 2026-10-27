(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* scroll progress */
  var bar = $('.progress span');
  function onScroll() {
    if (!bar) return;
    var h = document.body.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* mobile menu + dropdown */
  var nav = $('.nav'), burger = $('.burger');
  if (burger) burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  $$('.has-drop > button').forEach(function (b) {
    b.addEventListener('click', function () {
      var li = b.parentElement, open = li.classList.toggle('open');
      b.setAttribute('aria-expanded', open);
    });
  });
  document.addEventListener('click', function (e) {
    $$('.has-drop.open').forEach(function (li) { if (!li.contains(e.target)) li.classList.remove('open'); });
  });

  /* reveal (only for content below the first screen) */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  if (io && !reduce) $$('.reveal').forEach(function (el) {
    if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pre'); io.observe(el); }
  });

  /* counters */
  function fmt(v, dec) { return v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }); }
  var cio = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0),
        pre = el.dataset.pre || '', suf = el.dataset.suf || '', t0 = performance.now(), dur = 1400;
      cio.unobserve(el);
      (function tick(t) {
        var p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + fmt(to * k, dec) + suf;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: .4 }) : null;
  if (cio && !reduce) $$('[data-to]').forEach(function (el) {
    if (el.getBoundingClientRect().top > innerHeight) {
      el.textContent = (el.dataset.pre || '') + '0' + (el.dataset.suf || '');
      cio.observe(el);
    }
  });

  /* typed rotator */
  var rot = $('.rotator .word');
  if (rot) {
    var words = JSON.parse(rot.dataset.words), wi = 0, ci = words[0].w.length, del = false;
    if (!reduce) setTimeout(function step() {
      var cur = words[wi];
      if (!del) {
        if (ci < cur.w.length) { ci++; rot.textContent = cur.w.slice(0, ci); return setTimeout(step, 70); }
        del = true; return setTimeout(step, 1700);
      }
      if (ci > 0) { ci--; rot.textContent = cur.w.slice(0, ci); return setTimeout(step, 35); }
      del = false; wi = (wi + 1) % words.length; rot.className = 'word ' + words[wi].c; setTimeout(step, 200);
    }, 1800);
  }

  /* device label: Data Matrix-style mark + tilt */
  var dm = $('#dm');
  if (dm) {
    var n = 20, s = 11, out = '';
    var rnd = function () { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var on = (x === 0 || y === n - 1) ? true : y === 0 ? x % 2 === 0 : x === n - 1 ? y % 2 === 1 : rnd() > .52;
      if (on) out += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="currentColor"/>';
    }
    dm.innerHTML = out;
  }
  var lab = $('.dlabel');
  if (lab && !reduce && matchMedia('(hover: hover)').matches) {
    var stage = lab.parentElement;
    stage.addEventListener('mousemove', function (e) {
      var r = stage.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      lab.style.transform = 'rotateY(' + (px * 14) + 'deg) rotateX(' + (-py * 12) + 'deg)';
    });
    stage.addEventListener('mouseleave', function () { lab.style.transform = ''; });
  }

  /* spotlight cards */
  $$('.card').forEach(function (c) {
    c.addEventListener('pointermove', function (e) {
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* generic switchers: [data-switch] holds triggers with data-panel; panels carry data-group */
  $$('[data-switch]').forEach(function (box) {
    var group = box.dataset.switch;
    var triggers = $$('[data-panel]', box);
    function show(id) {
      triggers.forEach(function (t) { t.setAttribute('aria-selected', t.dataset.panel === id); });
      $$('[data-group="' + group + '"]').forEach(function (p) { p.hidden = p.id !== id; });
    }
    triggers.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t.dataset.panel); });
      t.addEventListener('keydown', function (e) {
        var k = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!k) return; e.preventDefault();
        var nx = triggers[(i + k + triggers.length) % triggers.length]; nx.focus(); show(nx.dataset.panel);
      });
    });
  });

  /* compare bars */
  var bio = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.style.setProperty('--w', e.target.dataset.w); bio.unobserve(e.target); } });
  }, { threshold: .3 }) : null;
  $$('.fill[data-w]').forEach(function (f) {
    if (bio && !reduce && f.getBoundingClientRect().top > innerHeight) { f.style.setProperty('--w', '0%'); bio.observe(f); }
    else f.style.setProperty('--w', f.dataset.w);
  });

  /* lightbox */
  var lb = $('#lightbox');
  if (lb) {
    var lbImg = $('img', lb), lbCap = $('figcaption span', lb), last = null;
    function close() { lb.hidden = true; if (last) last.focus(); }
    $$('[data-full]').forEach(function (b) {
      b.addEventListener('click', function () {
        last = b; lbImg.src = b.dataset.full; lbImg.alt = b.dataset.cap || ''; lbCap.textContent = b.dataset.cap || '';
        lb.hidden = false; $('.x', lb).focus();
      });
    });
    $('.x', lb).addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lb.hidden) close(); });
  }

  /* copy email */
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var el = document.getElementById(btn.dataset.copy), txt = el.textContent;
      function sel() { var r = document.createRange(); r.selectNodeContents(el); var w = getSelection(); w.removeAllRanges(); w.addRange(r); btn.textContent = 'Selected'; }
      try { navigator.clipboard.writeText(txt).then(function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy'; }, 1800); }, sel); } catch (e) { sel(); }
    });
  });

  /* skills search */
  var q = $('#skill-q');
  if (q) {
    var chips = $$('.chips span'), outEl = $('#skill-count');
    q.addEventListener('input', function () {
      var v = q.value.trim().toLowerCase(), hits = 0;
      chips.forEach(function (c) {
        var m = v && c.textContent.toLowerCase().indexOf(v) > -1;
        c.classList.toggle('hit', !!m); c.classList.toggle('dim', !!v && !m); if (m) hits++;
      });
      outEl.textContent = v ? hits + ' match' + (hits === 1 ? '' : 'es') : chips.length + ' skills';
    });
  }

  /* journey filters */
  var fbox = $('[data-filters]');
  if (fbox) {
    var fbtns = $$('button', fbox), items = $$('.vt li');
    fbtns.forEach(function (b) {
      b.addEventListener('click', function () {
        fbtns.forEach(function (x) { x.setAttribute('aria-selected', x === b); });
        var f = b.dataset.filter;
        items.forEach(function (li) { li.hidden = f !== 'all' && li.dataset.type !== f; });
      });
    });
  }

  /* GLAM globe */
  var cv = $('#globe');
  if (cv) {
    var ctx = cv.getContext('2d'), N = 1100, pts = [], ga = Math.PI * (3 - Math.sqrt(5)), W = 0, H = 0;
    for (var i = 0; i < N; i++) {
      var yy = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - yy * yy), th = ga * i;
      pts.push([Math.cos(th) * r, yy, Math.sin(th) * r, (i * 37) % N < 171]);
    }
    var tilt = .38, ct = Math.cos(tilt), st = Math.sin(tilt);
    function size() {
      var b = cv.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      W = b.width; H = b.height; cv.width = Math.round(W * d); cv.height = Math.round(H * d); ctx.setTransform(d, 0, 0, d, 0, 0);
    }
    function draw(t) {
      if (!W) return;
      ctx.clearRect(0, 0, W, H);
      var R = Math.min(W, H) * .42, cx = W / 2, cy = H / 2, a = t * .00012, ca = Math.cos(a), sa = Math.sin(a);
      var g = ctx.createRadialGradient(cx - R * .3, cy - R * .3, R * .1, cx, cy, R * 1.1);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(238,242,249,1)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.04, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(107,77,255,.18)'; ctx.lineWidth = 1; ctx.stroke();
      var scan = Math.sin(t * .0007) * .95;
      for (var i = 0; i < N; i++) {
        var p = pts[i], x = p[0] * ca - p[2] * sa, z = p[0] * sa + p[2] * ca, y = p[1] * ct - z * st, z2 = p[1] * st + z * ct;
        var d = (z2 + 1) / 2; if (d < .1) continue;
        var px = cx + x * R, py = cy + y * R;
        if (p[3]) {
          var hit = Math.abs(y - scan) < .06;
          ctx.fillStyle = hit ? 'rgba(226,61,127,' + (.4 + .6 * d) + ')' : 'rgba(107,77,255,' + (.25 + .7 * d) + ')';
          ctx.beginPath(); ctx.arc(px, py, (hit ? 3.4 : 2.3) * (.6 + .5 * d), 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(40,50,71,' + (.06 + .32 * d) + ')';
          ctx.fillRect(px - .75, py - .75, 1.5, 1.5);
        }
      }
      var ry = cy + scan * R * ct, rr = Math.sqrt(Math.max(0, 1 - scan * scan)) * R;
      ctx.strokeStyle = 'rgba(0,165,142,.55)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(cx, ry, rr, rr * st * .9 + 1, 0, 0, Math.PI * 2); ctx.stroke();
    }
    size(); draw(4000);
    addEventListener('resize', function () { size(); if (reduce) draw(4000); });
    if (!reduce) (function loop(t) { draw(t); requestAnimationFrame(loop); })(0);
  }
})();
