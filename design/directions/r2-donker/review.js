/*
 * r2-donker · review bar: Kleur (option) · Tekst (copy voice) · Koppen (heading type).
 * Loaded in <head> (sync, tiny) so colour + heading type apply before first paint.
 * Voices come from ../../system/copy.js (deferred); applied on DOMContentLoaded.
 */
(function () {
  "use strict";
  var root = document.documentElement;
  var GROUPS = [
    { key: "option", attr: "data-option", label: "Kleur", store: "r2-donker-option",
      items: [["nacht", "Nacht"], ["grafiet", "Grafiet"]] },
    { key: "copy", attr: "data-copy-voice", label: "Tekst", store: "r2-donker-copy",
      items: [["nuchter", "Nuchter"], ["speels", "Speels"], ["persoonlijk", "Persoonlijk"], ["kort", "Kort"]] },
    { key: "type", attr: "data-type", label: "Koppen", store: "r2-donker-type",
      items: [["a", "Strak"], ["b", "Serif"]] }
  ];
  var state = {};

  function ids(g) { return g.items.map(function (i) { return i[0]; }); }
  function params() { try { return new URLSearchParams(location.search); } catch (e) { return null; } }

  function initial(g) {
    var p = params(), q = p && p.get(g.key);
    if (q && ids(g).indexOf(q) > -1) return q;
    try { var s = localStorage.getItem(g.store); if (s && ids(g).indexOf(s) > -1) return s; } catch (e) {}
    return g.items[0][0];
  }

  function syncUrl() {
    try {
      var p = new URLSearchParams(location.search);
      GROUPS.forEach(function (g) {
        if (state[g.key] === g.items[0][0]) p.delete(g.key); else p.set(g.key, state[g.key]);
      });
      var qs = p.toString();
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
    } catch (e) {}
  }

  function set(g, id, persist) {
    state[g.key] = id;
    if (g.key === "copy") {
      if (window.EkkCopy) window.EkkCopy.apply(id); else root.setAttribute(g.attr, id);
    } else {
      root.setAttribute(g.attr, id);
    }
    if (persist) {
      try { localStorage.setItem(g.store, id); } catch (e) {}
      syncUrl();
    }
    var radios = document.querySelectorAll('.review-bar [data-group="' + g.key + '"] [role=radio]');
    Array.prototype.forEach.call(radios, function (r) {
      var on = r.getAttribute("data-value") === id;
      r.setAttribute("aria-checked", on ? "true" : "false");
      r.tabIndex = on ? 0 : -1;
    });
  }

  // colour + type before paint; the voice needs copy.js, so it waits for DOMContentLoaded
  GROUPS.forEach(function (g) {
    state[g.key] = initial(g);
    if (g.key !== "copy") root.setAttribute(g.attr, state[g.key]);
  });

  function buildBar() {
    var page = (location.pathname.split("/").pop() || "index.html");
    var links = [["index.html", "Home"], ["project.html", "Project"], ["system.html", "System"]];
    var bar = document.createElement("div");
    bar.className = "review-bar";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Design review tools");
    bar.innerHTML =
      '<span class="review-bar__name"><b>R2</b> Donker &amp; strak</span>' +
      '<button type="button" class="review-bar__toggle" aria-expanded="false" aria-controls="rb-panel">Opties</button>' +
      '<span class="review-bar__panel" id="rb-panel">' +
        GROUPS.map(function (g) {
          return '<span class="review-bar__group" data-group="' + g.key + '">' +
            '<span class="review-bar__label" id="rb-' + g.key + '">' + g.label + "</span>" +
            '<span role="radiogroup" aria-labelledby="rb-' + g.key + '">' +
              g.items.map(function (i) {
                return '<button type="button" role="radio" data-value="' + i[0] + '">' + i[1] + "</button>";
              }).join("") +
            "</span></span>";
        }).join("") +
        '<span class="review-bar__links">' +
          links.map(function (l) {
            return '<a href="' + l[0] + '"' + (page === l[0] ? ' aria-current="page"' : "") + ">" + l[1] + "</a>";
          }).join(" ") +
          ' <a href="../../../index.html">← All</a>' +
        "</span>" +
      "</span>";
    document.body.appendChild(bar);

    var toggle = bar.querySelector(".review-bar__toggle");
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      bar.classList.toggle("is-open", open);
    });

    GROUPS.forEach(function (g) {
      var group = bar.querySelector('[data-group="' + g.key + '"] [role=radiogroup]');
      group.addEventListener("click", function (e) {
        var b = e.target.closest("[role=radio]");
        if (b) set(g, b.getAttribute("data-value"), true);
      });
      group.addEventListener("keydown", function (e) {
        var keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        if (!(e.key in keys)) return;
        e.preventDefault();
        var list = ids(g), cur = list.indexOf(state[g.key]);
        var next = list[(cur + keys[e.key] + list.length) % list.length];
        set(g, next, true);
        group.querySelector('[data-value="' + next + '"]').focus();
      });
      set(g, state[g.key], false);
    });
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
