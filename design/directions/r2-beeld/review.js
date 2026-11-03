/* Review bar: review tooling only, not part of the design. */
(function () {
  "use strict";
  var OPTIONS = [["wit", "Wit"], ["donker", "Donker"]];
  var KEY = "r2-beeld:option";
  var html = document.documentElement;
  var page = (location.pathname.split("/").pop() || "index.html");

  function current() { return html.getAttribute("data-option") || OPTIONS[0][0]; }
  function setOption(v, focus) {
    html.setAttribute("data-option", v);
    try { localStorage.setItem(KEY, v); } catch (e) {}
    radios.forEach(function (r) {
      var on = r.getAttribute("data-value") === v;
      r.setAttribute("aria-checked", on ? "true" : "false");
      r.tabIndex = on ? 0 : -1;
      if (on && focus) r.focus();
    });
    links.forEach(function (a) { a.href = a.getAttribute("data-base") + "?option=" + v; });
    document.dispatchEvent(new CustomEvent("optionchange", { detail: v }));
  }

  var bar = document.createElement("div");
  bar.className = "review-bar";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Design review");
  bar.innerHTML =
    '<span class="review-bar__name">Beeld voorop</span>' +
    '<span role="radiogroup" aria-label="Option">' +
      OPTIONS.map(function (o) { return '<button type="button" role="radio" data-value="' + o[0] + '">' + o[1] + "</button>"; }).join("") +
    "</span>" +
    '<a data-base="index.html">Index</a><a data-base="project.html">Project</a><a data-base="system.html">System</a>' +
    '<span class="review-bar__sep" aria-hidden="true">|</span><a href="../../../index.html">&larr; All</a>';

  var radios = Array.prototype.slice.call(bar.querySelectorAll('[role="radio"]'));
  var links = Array.prototype.slice.call(bar.querySelectorAll("a[data-base]"));
  links.forEach(function (a) { if (a.getAttribute("data-base") === page) a.setAttribute("aria-current", "page"); });

  radios.forEach(function (r, i) {
    r.addEventListener("click", function () { setOption(r.getAttribute("data-value"), false); });
    r.addEventListener("keydown", function (e) {
      var d = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var n = radios[(i + d + radios.length) % radios.length];
      setOption(n.getAttribute("data-value"), true);
    });
  });

  document.body.appendChild(bar);
  // initial state without writing to storage
  var v = current();
  radios.forEach(function (r) { var on = r.getAttribute("data-value") === v; r.setAttribute("aria-checked", on ? "true" : "false"); r.tabIndex = on ? 0 : -1; });
  links.forEach(function (a) { a.href = a.getAttribute("data-base") + "?option=" + v; });
})();
