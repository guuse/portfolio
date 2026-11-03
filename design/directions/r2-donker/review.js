/*
 * r2-donker · option switch + review bar + small page enhancements.
 * Loaded in <head> (sync, tiny) so the option is applied before first paint.
 */
(function () {
  "use strict";
  var OPTIONS = [
    { id: "nacht", label: "Nacht" },
    { id: "grafiet", label: "Grafiet" }
  ];
  var KEY = "r2-donker-option";
  var root = document.documentElement;
  var ids = OPTIONS.map(function (o) { return o.id; });

  function initial() {
    var q = null;
    try { q = new URLSearchParams(location.search).get("option"); } catch (e) {}
    if (q && ids.indexOf(q) > -1) return q;
    try { var s = localStorage.getItem(KEY); if (s && ids.indexOf(s) > -1) return s; } catch (e) {}
    return ids[0];
  }

  function apply(id, persist) {
    root.setAttribute("data-option", id);
    if (persist) { try { localStorage.setItem(KEY, id); } catch (e) {} }
    var radios = document.querySelectorAll(".review-bar [role=radio]");
    Array.prototype.forEach.call(radios, function (r) {
      var on = r.getAttribute("data-value") === id;
      r.setAttribute("aria-checked", on ? "true" : "false");
      r.tabIndex = on ? 0 : -1;
    });
  }

  apply(initial(), false);

  function buildBar() {
    var page = (location.pathname.split("/").pop() || "index.html");
    var links = [["index.html", "Home"], ["project.html", "Project"], ["system.html", "System"]];
    var bar = document.createElement("div");
    bar.className = "review-bar";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Design review tools");
    bar.innerHTML =
      "<span><b>R2</b> Donker &amp; strak</span>" +
      '<span role="radiogroup" aria-label="Option">' +
        OPTIONS.map(function (o) {
          return '<button type="button" role="radio" data-value="' + o.id + '">' + o.label + "</button>";
        }).join("") +
      "</span>" +
      '<span class="review-bar__sep" aria-hidden="true"></span>' +
      '<span class="review-bar__links">' +
        links.map(function (l) {
          return '<a href="' + l[0] + '"' + (page === l[0] ? ' aria-current="page"' : "") + ">" + l[1] + "</a>";
        }).join(" ") +
      "</span>" +
      '<a href="../../../index.html">← All</a>';
    document.body.appendChild(bar);

    var group = bar.querySelector("[role=radiogroup]");
    group.addEventListener("click", function (e) {
      var b = e.target.closest("[role=radio]");
      if (b) apply(b.getAttribute("data-value"), true);
    });
    group.addEventListener("keydown", function (e) {
      var keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(e.key in keys)) return;
      e.preventDefault();
      var cur = ids.indexOf(root.getAttribute("data-option"));
      var next = ids[(cur + keys[e.key] + ids.length) % ids.length];
      apply(next, true);
      group.querySelector('[data-value="' + next + '"]').focus();
    });
    apply(root.getAttribute("data-option"), false);
  }

  function headerLine() {
    var h = document.querySelector(".site-header");
    if (!h) return;
    var on = function () { h.classList.toggle("is-scrolled", window.scrollY > 8); };
    on();
    window.addEventListener("scroll", on, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", function () { buildBar(); headerLine(); });
})();
