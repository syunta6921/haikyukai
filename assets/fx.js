(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  function onVisible(el, cb, margin) {
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting); }); }, { rootMargin: margin || "0px" }).observe(el);
  }

  /* ---------- split headings ---------- */
  function splitText(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          Array.from(n.textContent).forEach(function (ch) {
            if (/\s/.test(ch)) { frag.appendChild(document.createTextNode(ch)); return; }
            var s = document.createElement("span");
            s.className = "fx-ch"; s.style.setProperty("--i", i++); s.textContent = ch;
            frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") { walk(n); }
      });
    })(el);
  }
  if (!reduce) {
    document.querySelectorAll(".hk-title, .hk-showcase__title, .hk-contact__title").forEach(function (h) {
      if (h.getAttribute("aria-label") == null) h.setAttribute("aria-label", h.textContent.replace(/\s+/g, ""));
      splitText(h); h.classList.add("fx-split");
      var done = false;
      onVisible(h, function (v) { if (v && !done) { done = true; h.classList.add("is-split-in"); } }, "0px 0px -10% 0px");
    });
  }

  /* ---------- holo foil cards ---------- */
  document.querySelectorAll(".hk-person, .hk-value").forEach(function (c) {
    c.classList.add("fx-holo");
    c.addEventListener("pointermove", function (e) {
      var r = c.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty("--hx", (x * 100).toFixed(1) + "%");
      c.style.setProperty("--hy", (y * 100).toFixed(1) + "%");
    });
  });

  /* ---------- magnetic CTAs ---------- */
  if (fine && !reduce) {
    document.querySelectorAll(".hk-trial--lg").forEach(function (b) {
      b.classList.add("fx-mag");
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
        b.style.transform = "translate(" + (x * 0.18).toFixed(1) + "px," + (y * 0.28).toFixed(1) + "px)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
  }

  /* ---------- stats count-up ---------- */
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var to = parseFloat(el.dataset.count), started = false;
    if (reduce) return;
    el.firstChild.textContent = "0";
    onVisible(el, function (v) {
      if (!v || started) return; started = true;
      var t0 = performance.now(), dur = 1200;
      (function step(t) {
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.firstChild.textContent = String(Math.round(to * e));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  });

  if (reduce) return;

  /* ---------- wave field (values + gallery backgrounds) ---------- */
  function waves(section, color) {
    var cv = document.createElement("canvas");
    cv.className = "fx-waves"; cv.setAttribute("aria-hidden", "true");
    section.insertBefore(cv, section.firstChild);
    var ctx = cv.getContext("2d"), w = 0, h = 0, run = false, t = 0, mx = 0.5, my = 0.5;
    function size() { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * DPR; cv.height = h * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
    size(); window.addEventListener("resize", size);
    section.addEventListener("pointermove", function (e) { var r = section.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width; my = (e.clientY - r.top) / r.height; });
    function frame() {
      if (!run) return;
      t += 0.006; ctx.clearRect(0, 0, w, h);
      var lines = 26;
      for (var i = 0; i < lines; i++) {
        var y0 = (i / (lines - 1)) * h, amp = 18 + 22 * Math.sin(i * 0.4 + t * 2);
        ctx.beginPath();
        for (var x = 0; x <= w; x += 10) {
          var dx = x / w - mx, d = Math.exp(-(dx * dx) * 18) * (1 - Math.abs(i / lines - my)) * 34;
          var y = y0 + Math.sin(x * 0.006 + t * 3 + i * 0.35) * amp * 0.5 + Math.sin(x * 0.013 - t * 2) * 6 - d;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color.replace("A", (0.05 + 0.12 * (1 - Math.abs(i - lines / 2) / (lines / 2))).toFixed(3));
        ctx.lineWidth = 1.2; ctx.stroke();
      }
      requestAnimationFrame(frame);
    }
    onVisible(section, function (v) { if (v && !run) { run = true; requestAnimationFrame(frame); } else if (!v) run = false; });
  }
  var vs = document.querySelector(".hk-values"); if (vs) waves(vs, "rgba(255,46,138,A)");
  var gs = document.querySelector(".hk-gallery"); if (gs) waves(gs, "rgba(150,160,255,A)");

  /* ---------- particle volleyball (contact) ---------- */
  var contact = document.querySelector(".hk-contact");
  if (contact) {
    var old = contact.querySelector(".hk-contact__ball"); if (old) old.style.display = "none";
    var cv = document.createElement("canvas");
    cv.className = "fx-ballcanvas"; cv.setAttribute("aria-hidden", "true");
    contact.insertBefore(cv, contact.firstChild);
    var ctx = cv.getContext("2d"), S = 0, run = false, rotY = 0, rotX = 0.35, tx = 0, ty = 0;
    var pts = [], N = 1400;
    // points on a sphere, coloured by volleyball-like panel bands
    for (var i = 0; i < N; i++) {
      var y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963;
      var x = Math.cos(th) * r, z = Math.sin(th) * r;
      var band = Math.floor(((Math.atan2(z, x) + Math.PI) / (2 * Math.PI)) * 3 + (y > 0 ? 0.5 : 0)) % 3;
      pts.push([x, y, z, band, Math.random()]);
    }
    var cols = ["255,46,138", "255,255,255", "120,130,255"];
    function size2() { S = cv.clientWidth; cv.width = S * DPR; cv.height = S * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
    size2(); window.addEventListener("resize", size2);
    contact.addEventListener("pointermove", function (e) { var r = contact.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 0.8; ty = ((e.clientY - r.top) / r.height - 0.5) * 0.6; });
    function draw(t) {
      if (!run) return;
      rotY += 0.004 + tx * 0.01; rotX += (0.35 + ty - rotX) * 0.04;
      ctx.clearRect(0, 0, S, S);
      var R = S * 0.36, c = S / 2, cy = Math.cos(rotY), sy = Math.sin(rotY), cx = Math.cos(rotX), sx = Math.sin(rotX);
      var g = ctx.createRadialGradient(c, c, R * 0.2, c, c, R * 1.4);
      g.addColorStop(0, "rgba(255,46,138,0.10)"); g.addColorStop(1, "rgba(255,46,138,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
      for (var k = 0; k < N; k++) {
        var p = pts[k];
        var x1 = p[0] * cy - p[2] * sy, z1 = p[0] * sy + p[2] * cy;
        var y1 = p[1] * cx - z1 * sx, z2 = p[1] * sx + z1 * cx;
        var pul = 1 + 0.03 * Math.sin(t * 0.002 + p[4] * 6.28);
        var depth = (z2 + 1) / 2;
        ctx.fillStyle = "rgba(" + cols[p[3]] + "," + (0.12 + depth * 0.85).toFixed(3) + ")";
        var s = 0.6 + depth * 1.8;
        ctx.fillRect(c + x1 * R * pul - s / 2, c + y1 * R * pul - s / 2, s, s);
      }
      requestAnimationFrame(draw);
    }
    onVisible(contact, function (v) { if (v && !run) { run = true; requestAnimationFrame(draw); } else if (!v) run = false; });
  }
})();
