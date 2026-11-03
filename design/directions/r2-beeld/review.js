/* Review bar: review tooling only, not part of the design.
 * Three switches: Kleur (data-option), Tekst (copy voice), Koppen (data-type).
 * Each reads ?key=, then localStorage, else the first value; changes persist and update the URL. */
(function () {
  "use strict";
  var html = document.documentElement;
  var page = (location.pathname.split("/").pop() || "index.html");
  var Copy = window.EkkCopy;
  var GROUPS = [
    { key: "option", label: "Kleur", values: [["wit", "Wit"], ["donker", "Donker"]] },
    { key: "copy", label: "Tekst", values: [["nuchter", "Nuchter"], ["speels", "Speels"], ["persoonlijk", "Persoonlijk"], ["kort", "Kort"]] },
    { key: "type", label: "Koppen", values: [["a", "Serif"], ["b", "Sans"]] }
  ];
  var state = {};

  function read(g) {
    var ok = g.values.map(function (v) { return v[0]; }), v = null;
    try { v = new URLSearchParams(location.search).get(g.key); } catch (e) {}
    if (ok.indexOf(v) < 0) { try { v = localStorage.getItem("r2-beeld:" + g.key); } catch (e) { v = null; } }
    return ok.indexOf(v) < 0 ? ok[0] : v;
  }

  // Long headlines get a smaller size so every voice fits (desktop and 320px).
  function sizeHeadline() {
    var h = document.querySelector(".intro__title");
    if (!h) return;
    var n = h.textContent.length;
    h.setAttribute("data-len", n > 55 ? "long" : n < 30 ? "short" : "medium");
  }

  function applyState() {
    html.setAttribute("data-option", state.option);
    html.setAttribute("data-type", state.type);
    if (Copy) Copy.apply(state.copy);
    html.setAttribute("data-copy-voice", state.copy);
    sizeHeadline();
  }

  function query() {
    return "?option=" + state.option + "&copy=" + state.copy + "&type=" + state.type;
  }

  function syncUI() {
    radios.forEach(function (r) {
      var on = state[r.getAttribute("data-key")] === r.getAttribute("data-value");
      r.setAttribute("aria-checked", on ? "true" : "false");
      r.tabIndex = on ? 0 : -1;
    });
    links.forEach(function (a) { a.href = a.getAttribute("data-base") + query(); });
  }

  function set(key, value, focusEl) {
    state[key] = value;
    try { localStorage.setItem("r2-beeld:" + key, value); } catch (e) {}
    applyState();
    syncUI();
    try {
      var u = new URL(location.href);
      u.searchParams.set(key, value);
      history.replaceState(null, "", u);
    } catch (e) {}
    if (focusEl) focusEl.focus();
  }

  GROUPS.forEach(function (g) { state[g.key] = read(g); });

  var bar = document.createElement("div");
  bar.className = "review-bar";
  bar.setAttribute("role", "region");
  bar.setAttribute("aria-label", "Design review");
  bar.innerHTML =
    '<span class="review-bar__name">Beeld voorop</span>' +
    '<button type="button" class="review-bar__toggle" aria-expanded="false" aria-controls="rb-groups">Opties</button>' +
    '<span class="review-bar__groups" id="rb-groups">' +
    GROUPS.map(function (g) {
      return '<span class="review-bar__group"><span id="rb-' + g.key + '">' + g.label + '</span><span role="radiogroup" aria-labelledby="rb-' + g.key + '">' +
        g.values.map(function (v) { return '<button type="button" role="radio" data-key="' + g.key + '" data-value="' + v[0] + '">' + v[1] + "</button>"; }).join("") +
        "</span></span>";
    }).join("") +
    "</span>" +
    '<a data-base="index.html">Index</a><a data-base="project.html">Project</a><a data-base="system.html">System</a>' +
    '<span class="review-bar__sep" aria-hidden="true">|</span><a href="../../../index.html">&larr; All</a>';

  var radios = Array.prototype.slice.call(bar.querySelectorAll('[role="radio"]'));
  var links = Array.prototype.slice.call(bar.querySelectorAll("a[data-base]"));
  links.forEach(function (a) { if (a.getAttribute("data-base") === page) a.setAttribute("aria-current", "page"); });

  radios.forEach(function (r) {
    r.addEventListener("click", function () { set(r.getAttribute("data-key"), r.getAttribute("data-value")); });
    r.addEventListener("keydown", function (e) {
      var d = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      var group = Array.prototype.slice.call(r.parentNode.querySelectorAll('[role="radio"]'));
      var n = group[(group.indexOf(r) + d + group.length) % group.length];
      set(n.getAttribute("data-key"), n.getAttribute("data-value"), n);
    });
  });

  var toggle = bar.querySelector(".review-bar__toggle");
  toggle.addEventListener("click", function () {
    var open = bar.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.body.appendChild(bar);
  applyState();
  syncUI();
})();
