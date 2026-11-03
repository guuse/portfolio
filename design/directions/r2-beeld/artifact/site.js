/* r2-beeld · round 8: small page behaviour shared by the CV and the project pages.
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

  /* Nav: mark the section in view (CV only; project pages mark their own link). */
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
