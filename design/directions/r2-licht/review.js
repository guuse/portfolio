/* r2-licht · review bar: option switch (?option= → localStorage → first). Review tooling only. */
(function () {
  "use strict";
  var OPTIONS = ["licht", "zacht"];
  var KEY = "r2-licht:option";
  var html = document.documentElement;

  function initial() {
    var m = /[?&]option=([^&#]+)/.exec(location.search);
    if (m && OPTIONS.indexOf(m[1]) > -1) return m[1];
    try { var s = localStorage.getItem(KEY); if (OPTIONS.indexOf(s) > -1) return s; } catch (e) {}
    return OPTIONS[0];
  }

  function set(opt, save) {
    html.setAttribute("data-option", opt);
    var radios = document.querySelectorAll(".review-bar [role=radio]");
    for (var i = 0; i < radios.length; i++) {
      var on = radios[i].getAttribute("data-value") === opt;
      radios[i].setAttribute("aria-checked", on ? "true" : "false");
      radios[i].tabIndex = on ? 0 : -1;
    }
    if (save) { try { localStorage.setItem(KEY, opt); } catch (e) {} }
  }

  set(initial(), false);

  document.addEventListener("DOMContentLoaded", function () {
    set(html.getAttribute("data-option"), false);
    var group = document.querySelector(".review-bar [role=radiogroup]");
    if (!group) return;
    group.addEventListener("click", function (e) {
      var b = e.target.closest("[role=radio]");
      if (b) set(b.getAttribute("data-value"), true);
    });
    group.addEventListener("keydown", function (e) {
      var dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      var i = OPTIONS.indexOf(html.getAttribute("data-option"));
      var next = OPTIONS[(i + dir + OPTIONS.length) % OPTIONS.length];
      set(next, true);
      group.querySelector('[data-value="' + next + '"]').focus();
    });
  });
})();
