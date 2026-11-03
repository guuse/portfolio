/*
 * r2-licht · review bar. Three switches: Kleur (data-option), Tekst (copy voice),
 * Koppen (data-type). Each reads ?param= → localStorage → first, and writes back to
 * localStorage + the URL (replaceState). Review tooling only.
 */
(function () {
  "use strict";
  var html = document.documentElement;
  var GROUPS = {
    option: { values: ["licht", "zacht"], key: "r2-licht:option",
      set: function (v) { html.setAttribute("data-option", v); } },
    copy: { values: ["nuchter", "speels", "persoonlijk", "kort"], key: "r2-licht:copy",
      set: function (v) {
        html.setAttribute("data-copy-voice", v);
        if (window.EkkCopy && document.readyState !== "loading") window.EkkCopy.apply(v);
      } },
    type: { values: ["a", "b"], key: "r2-licht:type",
      set: function (v) { html.setAttribute("data-type", v); } }
  };
  var state = {};

  function param(name) {
    var m = new RegExp("[?&]" + name + "=([^&#]+)").exec(location.search);
    return m && decodeURIComponent(m[1]);
  }
  function initial(name) {
    var g = GROUPS[name], p = param(name);
    if (g.values.indexOf(p) > -1) return p;
    try { var s = localStorage.getItem(g.key); if (g.values.indexOf(s) > -1) return s; } catch (e) {}
    return g.values[0];
  }
  function syncUrl() {
    try {
      var u = new URL(location.href);
      Object.keys(state).forEach(function (k) { u.searchParams.set(k, state[k]); });
      history.replaceState(null, "", u);
    } catch (e) {}
  }
  function syncRadios(name) {
    var radios = document.querySelectorAll('.review-bar [data-group="' + name + '"] [role=radio]');
    for (var i = 0; i < radios.length; i++) {
      var on = radios[i].getAttribute("data-value") === state[name];
      radios[i].setAttribute("aria-checked", on ? "true" : "false");
      radios[i].tabIndex = on ? 0 : -1;
    }
  }
  function set(name, v, save) {
    state[name] = v;
    GROUPS[name].set(v);
    syncRadios(name);
    if (save) {
      try { localStorage.setItem(GROUPS[name].key, v); } catch (e) {}
      syncUrl();
    }
  }

  Object.keys(GROUPS).forEach(function (n) { set(n, initial(n), false); });

  document.addEventListener("DOMContentLoaded", function () {
    Object.keys(GROUPS).forEach(function (n) { set(n, state[n], false); });
    if (state.copy !== "nuchter" && window.EkkCopy) window.EkkCopy.apply(state.copy);

    var bar = document.querySelector(".review-bar");
    if (!bar) return;
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("[role=radio]");
      if (b) set(b.closest("[data-group]").getAttribute("data-group"), b.getAttribute("data-value"), true);
      var t = e.target.closest(".review-bar__toggle");
      if (t) {
        var open = t.getAttribute("aria-expanded") !== "true";
        t.setAttribute("aria-expanded", open ? "true" : "false");
        bar.classList.toggle("is-open", open);
      }
    });
    bar.addEventListener("keydown", function (e) {
      var dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      var grp = e.target.closest && e.target.closest("[data-group]");
      if (!dir || !grp) return;
      e.preventDefault();
      var name = grp.getAttribute("data-group"), vals = GROUPS[name].values;
      var next = vals[(vals.indexOf(state[name]) + dir + vals.length) % vals.length];
      set(name, next, true);
      grp.querySelector('[data-value="' + next + '"]').focus();
    });
  });
})();
