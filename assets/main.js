(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* header, progress, to-top */
  var header = document.querySelector(".hk-header");
  var bar = document.querySelector(".hk-progress");
  var toTop = document.querySelector(".hk-totop");
  var band = document.querySelector(".hk-band");
  function onScroll() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var y = window.scrollY;
    bar.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    header.classList.toggle("is-solid", y > 40);
    toTop.classList.toggle("is-show", y > window.innerHeight);
    if (band && !reduce) {
      var r = band.getBoundingClientRect();
      band.style.setProperty("--band", ((r.top / window.innerHeight) * -60).toFixed(1) + "px");
    }
  }
  window.addEventListener("scroll", function () { requestAnimationFrame(onScroll); }, { passive: true });
  onScroll();
  toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

  /* mobile nav */
  var burger = document.querySelector(".hk-burger");
  var nav = document.querySelector(".hk-nav");
  burger.addEventListener("click", function () {
    var open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
  });
  nav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      nav.classList.remove("is-open"); burger.classList.remove("is-open"); burger.setAttribute("aria-expanded", "false");
    });
  });

  /* reveal (transform only) */
  var reveals = document.querySelectorAll("[data-reveal]");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("is-shown"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-shown"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* 3D tilt */
  document.querySelectorAll(".hk-tilt").forEach(function (el) {
    el.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" || reduce) return;
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--rx", (-y * 10).toFixed(2) + "deg");
      el.style.setProperty("--ry", (x * 12).toFixed(2) + "deg");
      el.style.setProperty("--gx", ((x + 0.5) * 100).toFixed(1) + "%");
      el.style.setProperty("--gy", ((y + 0.5) * 100).toFixed(1) + "%");
    });
    el.addEventListener("pointerleave", function () { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
  });

  /* scroll-driven journey */
  var journey = document.querySelector(".hk-journey");
  var video = document.querySelector(".hk-journey__video");
  var chapters = Array.prototype.slice.call(document.querySelectorAll(".hk-chapter"));
  var railBtns = Array.prototype.slice.call(document.querySelectorAll(".hk-journey__rail button"));
  var src = window.innerWidth < 820 ? video.dataset.mobile : video.dataset.src;
  if (!reduce) { video.src = src; video.load(); }
  var target = 0, current = 0, active = -1, duration = 0;
  video.addEventListener("loadedmetadata", function () { duration = video.duration || 0; });
  function journeyProgress() {
    var r = journey.getBoundingClientRect();
    var total = journey.offsetHeight - window.innerHeight;
    return Math.min(1, Math.max(0, -r.top / total));
  }
  function setChapter(i) {
    if (i === active) return;
    active = i;
    chapters.forEach(function (c, k) { c.classList.toggle("is-active", k === i); });
    railBtns.forEach(function (b, k) { b.classList.toggle("is-active", k === i); b.setAttribute("aria-current", k === i ? "step" : "false"); });
  }
  function tick() {
    var p = journeyProgress();
    journey.style.setProperty("--p", p.toFixed(3));
    setChapter(Math.min(chapters.length - 1, Math.floor(p * chapters.length * 0.999)));
    if (duration && !reduce) {
      target = p * (duration - 0.05);
      current += (target - current) * 0.18;
      if (Math.abs(video.currentTime - current) > 0.03 && !video.seeking) video.currentTime = current;
    }
    requestAnimationFrame(tick);
  }
  setChapter(0);
  requestAnimationFrame(tick);
  railBtns.forEach(function (b, k) {
    b.addEventListener("click", function () {
      var total = journey.offsetHeight - window.innerHeight;
      var y = journey.offsetTop + total * ((k + 0.5) / chapters.length);
      window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* slideshow */
  var slides = Array.prototype.slice.call(document.querySelectorAll(".hk-slides__item"));
  var dots = Array.prototype.slice.call(document.querySelectorAll(".hk-slides__dots button"));
  var si = 0, paused = false;
  function show(i) {
    si = i;
    slides.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
    dots.forEach(function (d, k) { d.classList.toggle("is-active", k === i); d.setAttribute("aria-selected", String(k === i)); });
  }
  dots.forEach(function (d, k) { d.addEventListener("click", function () { show(k); }); });
  var slideBox = document.querySelector(".hk-slides");
  slideBox.addEventListener("mouseenter", function () { paused = true; });
  slideBox.addEventListener("mouseleave", function () { paused = false; });
  if (!reduce) setInterval(function () { if (!paused) show((si + 1) % slides.length); }, 5000);

  /* gallery filter + lightbox */
  var items = Array.prototype.slice.call(document.querySelectorAll(".hk-grid__item"));
  var filterBtns = document.querySelectorAll(".hk-filters button");
  var visible = items.slice();
  filterBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      var f = b.dataset.filter;
      filterBtns.forEach(function (x) { x.classList.toggle("is-active", x === b); x.setAttribute("aria-pressed", String(x === b)); });
      visible = items.filter(function (it) { return f === "all" || it.dataset.tag === f; });
      items.forEach(function (it) { it.hidden = visible.indexOf(it) === -1; });
    });
  });
  var lb = document.querySelector(".hk-lightbox");
  var lbImg = lb.querySelector("img");
  var lbCap = lb.querySelector(".hk-lb-cap");
  var lbCount = lb.querySelector(".hk-lb-count");
  var li = 0, lastFocus = null;
  function openLb(i) {
    li = i;
    var it = visible[i], img = it.querySelector("img");
    lbImg.src = img.src; lbImg.alt = img.alt;
    lbCap.textContent = img.alt; lbCount.textContent = (i + 1) + " / " + visible.length;
    lb.hidden = false; document.body.style.overflow = "hidden";
    lb.querySelector(".hk-lb-close").focus();
  }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  function stepLb(d) { openLb((li + d + visible.length) % visible.length); }
  items.forEach(function (it) {
    it.addEventListener("click", function () { lastFocus = it; openLb(visible.indexOf(it)); });
  });
  lb.addEventListener("click", closeLb);
  lb.querySelector("figure").addEventListener("click", function (e) { e.stopPropagation(); });
  lb.querySelector(".hk-lb-close").addEventListener("click", function (e) { e.stopPropagation(); closeLb(); });
  lb.querySelector(".hk-lb-prev").addEventListener("click", function (e) { e.stopPropagation(); stepLb(-1); });
  lb.querySelector(".hk-lb-next").addEventListener("click", function (e) { e.stopPropagation(); stepLb(1); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowRight") stepLb(1);
    if (e.key === "ArrowLeft") stepLb(-1);
  });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
