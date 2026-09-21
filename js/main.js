// Mobile drawer navigation
(function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".site-head__nav");
  var backdrop = document.querySelector(".nav-backdrop");
  if (!toggle || !nav) return;

  function setOpen(open) {
    nav.classList.toggle("open", open);
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("nav-open", open);
  }

  toggle.addEventListener("click", function () {
    setOpen(!nav.classList.contains("open"));
  });
  if (backdrop) backdrop.addEventListener("click", function () { setOpen(false); });
  nav.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setOpen(false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });
})();

// Scroll-triggered reveals
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var items = document.querySelectorAll("[data-reveal]");

  if (reduced || !("IntersectionObserver" in window)) {
    items.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
  );

  items.forEach(function (el) { observer.observe(el); });
})();

// Project gallery slider
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-slider]").forEach(function (root) {
    var track = root.querySelector("[data-slider-track]");
    if (!track) return;
    var slides = Array.prototype.slice.call(track.children);
    if (!slides.length) return;

    var prev = root.querySelector("[data-slider-prev]");
    var next = root.querySelector("[data-slider-next]");
    var current = root.querySelector("[data-slider-current]");
    var fill = root.querySelector("[data-slider-fill]");
    var total = slides.length;
    var target = 0;
    var settle;

    function pad(n) { return n < 10 ? "0" + n : String(n); }

    // a slide's left edge measured from the track's left edge, in scroll units
    function offsetOf(slide) {
      return track.scrollLeft + slide.getBoundingClientRect().left - track.getBoundingClientRect().left;
    }

    function nearestIndex() {
      var best = 0;
      var shortest = Infinity;
      slides.forEach(function (slide, i) {
        var distance = Math.abs(offsetOf(slide) - track.scrollLeft);
        if (distance < shortest) { shortest = distance; best = i; }
      });
      return best;
    }

    // Chrome's mandatory snapping can pin the track and swallow a programmatic
    // scroll, so suspend snapping for the duration of an arrow-driven move.
    var restore;
    function goTo(i) {
      var slide = slides[Math.max(0, Math.min(total - 1, i))];
      track.style.scrollSnapType = "none";
      track.scrollTo({ left: offsetOf(slide), behavior: reduced ? "auto" : "smooth" });
      window.clearTimeout(restore);
      restore = window.setTimeout(function () { track.style.scrollSnapType = ""; }, 600);
    }

    // step from the last requested slide, so rapid clicks queue up instead of
    // re-reading a position that is still animating
    function step(delta) {
      target = Math.max(0, Math.min(total - 1, target + delta));
      goTo(target);
    }

    function paint() {
      var i = nearestIndex();
      if (current) current.textContent = pad(i + 1);
      if (fill) fill.style.transform = "scaleX(" + (i + 1) / total + ")";
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    }

    if (prev) prev.addEventListener("click", function () { step(-1); });
    if (next) next.addEventListener("click", function () { step(1); });

    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    });

    var ticking = false;
    track.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(function () { paint(); ticking = false; });
      }
      // once scrolling stops, adopt wherever the reader actually landed
      window.clearTimeout(settle);
      settle = window.setTimeout(function () { target = nearestIndex(); }, 140);
    }, { passive: true });

    window.addEventListener("resize", function () { paint(); target = nearestIndex(); });
    paint();
  });
})();
