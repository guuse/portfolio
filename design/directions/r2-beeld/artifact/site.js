/* r2-beeld · round 8: small page behaviour shared by the homepage and the project pages.
 * Copy-email button, nav tracking, diagram mounting and the screenshot lightbox. */
(function () {
  "use strict";
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* Email: selectable text plus a copy button; falls back to selecting the text. */
  Array.prototype.forEach.call(document.querySelectorAll("[data-copy-target]"), function (btn) {
    var target = document.getElementById(btn.getAttribute("data-copy-target"));
    var label = btn.querySelector(".copy__label");
    var status = document.getElementById(btn.getAttribute("aria-describedby"));
    var original = label ? label.textContent : "";
    function say(msg) {
      if (label) label.textContent = msg;
      if (status) status.textContent = msg;
      clearTimeout(btn._t);
      btn._t = setTimeout(function () { if (label) label.textContent = original; if (status) status.textContent = ""; }, 2200);
    }
    function selectText() {
      try { var r = document.createRange(); r.selectNodeContents(target); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {}
    }
    btn.addEventListener("click", function () {
      var text = target.textContent.trim();
      try {
        navigator.clipboard.writeText(text).then(function () { say("Copied"); }, function () { selectText(); say("Selected, press Ctrl/Cmd+C"); });
      } catch (e) { selectText(); say("Selected, press Ctrl/Cmd+C"); }
    });
  });

  /* Nav: mark the section in view (homepage only; project pages mark their own link). */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var sections = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); }).filter(Boolean);
  if (sections.length) {
    var track = function () {
      var y = window.scrollY + window.innerHeight * 0.35, current = null;
      sections.forEach(function (s) { if (s.offsetTop <= y) current = s.id; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = sections[sections.length - 1].id;
      links.forEach(function (a) { if (a.getAttribute("href") === "#" + current) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current"); });
    };
    var ticking = false;
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; track(); }); } }, { passive: true });
    track();
  }

  /* Diagrams (project pages): already in the HTML, animated here. */
  if (window.BeeldDiagrams) window.BeeldDiagrams.mount(document);

  /* Hero prints: nudge with a mouse or pen, spring back on release. */
  Array.prototype.forEach.call(document.querySelectorAll(".print"), function (el) {
    var sx = 0, sy = 0, id = null, LIM = 60;
    el.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || e.pointerType === "touch") return;
      id = e.pointerId; sx = e.clientX; sy = e.clientY; el.setPointerCapture(id); el.classList.add("is-dragging"); e.preventDefault();
    });
    el.addEventListener("pointermove", function (e) {
      if (e.pointerId !== id) return;
      el.style.setProperty("--dx", Math.max(-LIM, Math.min(LIM, e.clientX - sx)) + "px");
      el.style.setProperty("--dy", Math.max(-LIM, Math.min(LIM, e.clientY - sy)) + "px");
    });
    function end(e) { if (e.pointerId !== id) return; id = null; el.classList.remove("is-dragging"); el.style.removeProperty("--dx"); el.style.removeProperty("--dy"); }
    el.addEventListener("pointerup", end); el.addEventListener("pointercancel", end);
  });

  /* Interests: hovering or focusing one lifts the matching print. */
  Array.prototype.forEach.call(document.querySelectorAll("[data-lift]"), function (item) {
    var print = document.querySelector('[data-print="' + item.getAttribute("data-lift") + '"]');
    if (!print) return;
    var on = function () { print.classList.add("is-lifted"); }, off = function () { print.classList.remove("is-lifted"); };
    item.addEventListener("mouseenter", on); item.addEventListener("mouseleave", off);
    item.addEventListener("focus", on); item.addEventListener("blur", off);
  });

  /* ---------------------------------------------------------------- round 15: motion */
  var RM = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var hasIO = "IntersectionObserver" in window;

  /* Scrollytelling: each step sets a state on the sticky figure (classes s1..sN). */
  function setState(el, n) {
    var max = +el.getAttribute("data-steps") || 7, prev = el.__state || 0;
    for (var i = 1; i <= max; i++) el.classList.toggle("s" + i, i <= n);
    for (var j = 1; j <= max; j++) el.classList.toggle("at" + j, j === n);
    Array.prototype.forEach.call(el.querySelectorAll(".e"), function (e) {
      var k = +e.getAttribute("data-show");
      e.classList.toggle("is-cur", k > (n > prev ? prev : n - 1) && k <= n);
    });
    el.classList.add("is-live");
    el.__state = n;
  }
  if (!RM && hasIO) {
    Array.prototype.forEach.call(document.querySelectorAll(".scrolly"), function (sc) {
      var fig = sc.querySelector(".scrolly__fig .story, .scrolly__fig .mstack");
      var steps = Array.prototype.slice.call(sc.querySelectorAll(".scrolly__step"));
      if (!fig || !steps.length) return;
      document.documentElement.classList.add("js-scrolly");
      // mobile: a copy of the figure above each step, frozen at that step's state
      steps.forEach(function (st) {
        var mini = st.querySelector(".scrolly__mini");
        if (!mini) return;
        var c = fig.cloneNode(true);
        c.removeAttribute("role"); c.setAttribute("aria-hidden", "true");
        var vb = st.getAttribute("data-vb");
        if (vb && c.tagName.toLowerCase() === "svg") {
          c.setAttribute("viewBox", vb);
          c.style.width = Math.max(340, Math.round(+vb.split(" ")[2] * 0.78)) + "px";
        }
        mini.appendChild(c);
        setState(c, +st.getAttribute("data-state"));
        c.classList.remove("is-live");
      });
      setState(fig, +steps[0].getAttribute("data-state"));
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (!e.isIntersecting) return;
          steps.forEach(function (s) { s.classList.toggle("is-active", s === e.target); });
          setState(fig, +e.target.getAttribute("data-state"));
        });
      }, { rootMargin: "-45% 0px -45% 0px" });
      steps.forEach(function (s) { io.observe(s); });
    });
  }

  /* Reveal once: sections, cards, list items; and sets that animate their children. */
  if (!RM && hasIO) {
    var rsel = ".sec, .cover, .phase, .like, .pcard, .also__row, .reveal-set, .pipe";
    var rels = Array.prototype.slice.call(document.querySelectorAll(rsel));
    rels.forEach(function (el) {
      el.classList.add("reveal");
      var i = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty("--rd", Math.min(i, 5) * 70 + "ms");
    });
    document.documentElement.classList.add("js-reveal");
    var rio = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); rio.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    rels.forEach(function (el) { rio.observe(el); });
  }

  /* Scroll-linked: cover parallax and the Experience line drawing itself. */
  if (!RM) {
    var covers = Array.prototype.slice.call(document.querySelectorAll(".cover__img"));
    var phases = document.querySelector(".phases");
    var tick = false;
    var onScroll = function () {
      var vh = window.innerHeight;
      covers.forEach(function (img) {
        var r = img.parentNode.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2) / vh - 0.5;
        img.style.transform = "translate3d(0," + (p * -22).toFixed(1) + "px,0) scale(1.06)";
      });
      if (phases) {
        var b = phases.getBoundingClientRect();
        var pr = Math.max(0, Math.min(1, (vh * 0.7 - b.top) / b.height));
        phases.style.setProperty("--p", pr.toFixed(3));
      }
    };
    window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(function () { tick = false; onScroll(); }); } }, { passive: true });
    onScroll();
    document.documentElement.classList.add("js-motion");
  }

  /* Lightbox: any button[data-lb] inside a [data-lb-group] list. */
  var lb = document.getElementById("lightbox");
  if (!lb) return;
  var img = lb.querySelector(".lightbox__img"), cap = lb.querySelector(".lightbox__cap"), count = lb.querySelector(".lightbox__count");
  var items = [], index = 0, trigger = null, rest = document.querySelector(".site");
  function render() {
    var it = items[index];
    img.src = it.src; img.width = it.w; img.height = it.h; img.alt = it.alt;
    cap.textContent = it.cap; count.textContent = (index + 1) + " of " + items.length;
    lb.querySelector("[data-lb-prev]").hidden = items.length < 2;
    lb.querySelector("[data-lb-next]").hidden = items.length < 2;
  }
  function open(btn) {
    var group = btn.closest("[data-lb-group]");
    var btns = Array.prototype.slice.call(group.querySelectorAll("button[data-lb]"));
    items = btns.map(function (b) {
      var i = b.querySelector("img"), fc = b.closest("figure").querySelector("figcaption");
      return { src: i.currentSrc || i.src, w: i.getAttribute("width"), h: i.getAttribute("height"), alt: i.alt, cap: fc ? fc.textContent : i.alt };
    });
    index = btns.indexOf(btn); trigger = btn;
    render(); lb.hidden = false;
    if (rest) rest.inert = true;
    document.documentElement.style.overflow = "hidden";
    lb.querySelector("[data-lb-close]").focus();
  }
  function close() {
    lb.hidden = true;
    if (rest) rest.inert = false;
    document.documentElement.style.overflow = "";
    if (trigger) trigger.focus();
  }
  function step(d) { if (items.length > 1) { index = (index + d + items.length) % items.length; render(); } }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("button[data-lb]");
    if (b) { e.preventDefault(); open(b); }
  });
  lb.addEventListener("click", function (e) {
    if (e.target.closest("[data-lb-prev]")) return step(-1);
    if (e.target.closest("[data-lb-next]")) return step(1);
    if (e.target.closest("[data-lb-close]") || e.target === lb || e.target.classList.contains("lightbox__stage")) close();
  });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    else if (e.key === "Tab") {
      var f = Array.prototype.filter.call(lb.querySelectorAll("button"), function (x) { return !x.hidden; });
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  var sx = null;
  lb.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") sx = e.clientX; });
  lb.addEventListener("pointerup", function (e) { if (sx === null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); });
  void reduce;

})();
