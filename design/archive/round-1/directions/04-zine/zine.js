/* 04 · Zine: option switch + small enhancements. The page reads fine without this. */
(function () {
  var OPTIONS = ['fluor-pink-teal', 'yellow-blue', 'nachtdruk'];
  var KEY = 'ekk-zine-option';
  var root = document.documentElement;
  root.classList.add('js');

  function initial() {
    try {
      var q = new URLSearchParams(location.search).get('option');
      if (OPTIONS.indexOf(q) > -1) return q;
    } catch (e) {}
    try {
      var s = localStorage.getItem(KEY);
      if (OPTIONS.indexOf(s) > -1) return s;
    } catch (e) {}
    try {
      if (matchMedia('(prefers-color-scheme: dark)').matches) return 'nachtdruk';
    } catch (e) {}
    return OPTIONS[0];
  }

  function apply(opt, persist) {
    root.setAttribute('data-option', opt);
    var radios = document.querySelectorAll('.review-bar input[name="zine-option"]');
    for (var i = 0; i < radios.length; i++) radios[i].checked = radios[i].value === opt;
    if (persist) {
      try { localStorage.setItem(KEY, opt); } catch (e) {}
      try {
        var u = new URL(location.href);
        u.searchParams.set('option', opt);
        history.replaceState(null, '', u);
      } catch (e) {}
    }
    document.dispatchEvent(new CustomEvent('zine:option', { detail: opt }));
  }

  apply(initial(), false);

  document.addEventListener('DOMContentLoaded', function () {
    apply(root.getAttribute('data-option'), false);
    document.addEventListener('change', function (e) {
      var t = e.target;
      if (t && t.name === 'zine-option') apply(t.value, true);
    });

    // Keep the option in links between index and system sheet.
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-keep-option]');
      if (!a) return;
      try {
        var u = new URL(a.getAttribute('href'), location.href);
        u.searchParams.set('option', root.getAttribute('data-option'));
        a.href = u.href;
      } catch (err) {}
    });

    // "Press run": drum 2 lands on the display type once, then sits misregistered.
    var reduce = false;
    try { reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
    if (!reduce && 'IntersectionObserver' in window) {
      root.classList.add('press-ready');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-pressing'); io.unobserve(en.target); }
        });
      }, { threshold: 0.4 });
      document.querySelectorAll('[data-press]').forEach(function (el) { io.observe(el); });
    }
  });
})();
