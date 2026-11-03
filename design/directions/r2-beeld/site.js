/* r2-beeld · small page enhancements: draggable prints and the email copy button. */
(function () {
  "use strict";

  /* Prints: pointer users can nudge them a little; they spring back on release. */
  var LIMIT = 70;
  Array.prototype.forEach.call(document.querySelectorAll(".print"), function (el) {
    var sx = 0, sy = 0, id = null;
    el.addEventListener("pointerdown", function (e) {
      if (e.button !== 0 || e.pointerType === "touch") return; // touch keeps scrolling the page
      id = e.pointerId; sx = e.clientX; sy = e.clientY;
      el.setPointerCapture(id);
      el.classList.add("is-dragging");
      e.preventDefault();
    });
    el.addEventListener("pointermove", function (e) {
      if (e.pointerId !== id) return;
      var dx = Math.max(-LIMIT, Math.min(LIMIT, e.clientX - sx));
      var dy = Math.max(-LIMIT, Math.min(LIMIT, e.clientY - sy));
      el.style.setProperty("--dx", dx + "px");
      el.style.setProperty("--dy", dy + "px");
    });
    function end(e) {
      if (e.pointerId !== id) return;
      id = null;
      el.classList.remove("is-dragging");
      el.style.removeProperty("--dx");
      el.style.removeProperty("--dy");
    }
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  });

  /* Email: selectable text plus a copy button; falls back to selecting the text. */
  Array.prototype.forEach.call(document.querySelectorAll("[data-copy-target]"), function (btn) {
    var target = document.getElementById(btn.getAttribute("data-copy-target"));
    var label = btn.querySelector(".copy__label");
    var status = document.getElementById(btn.getAttribute("aria-describedby"));
    function say(msg) {
      if (label) label.textContent = msg;
      if (status) status.textContent = msg === "Copy address" ? "" : msg;
      clearTimeout(btn._t);
      btn._t = setTimeout(function () { if (label) label.textContent = "Copy address"; if (status) status.textContent = ""; }, 2200);
    }
    function selectText() {
      try {
        var r = document.createRange(); r.selectNodeContents(target);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      } catch (e) {}
    }
    btn.addEventListener("click", function () {
      var text = target.textContent.trim();
      try {
        navigator.clipboard.writeText(text).then(function () { say("Copied"); }, function () { selectText(); say("Selected, press Ctrl/Cmd+C"); });
      } catch (e) { selectText(); say("Selected, press Ctrl/Cmd+C"); }
    });
  });

  /* Nav: mark the section in view with aria-current, and give the sticky header an edge. */
  var header = document.querySelector(".site-header");
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var sections = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); }).filter(Boolean);
  function track() {
    if (header) header.classList.toggle("is-stuck", window.scrollY > 8);
    var y = window.scrollY + window.innerHeight * 0.35, current = null;
    sections.forEach(function (s) { if (s.offsetTop <= y) current = s.id; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4 && sections.length) current = sections[sections.length - 1].id;
    links.forEach(function (a) {
      if (a.getAttribute("href") === "#" + current) a.setAttribute("aria-current", "location"); else a.removeAttribute("aria-current");
    });
  }
  var ticking = false;
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; track(); }); } }, { passive: true });
  window.addEventListener("resize", track);
  track();
})();
