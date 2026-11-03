/* 01 · Spec Sheet: option switch (review bar). Progressive enhancement; the page reads fine without it. */
(function () {
  var OPTIONS = ['paper', 'night-shift', 'hi-vis'];
  var KEY = 'ekk-01-spec-sheet-option';
  var root = document.documentElement;

  function pick() {
    try {
      var q = new URLSearchParams(location.search).get('option');
      if (q && OPTIONS.indexOf(q) > -1) return q;
    } catch (e) {}
    try {
      var s = localStorage.getItem(KEY);
      if (s && OPTIONS.indexOf(s) > -1) return s;
    } catch (e) {}
    if (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) return 'night-shift';
    return OPTIONS[0];
  }

  function apply(opt, persist) {
    root.setAttribute('data-option', opt);
    if (!persist) return;
    try { localStorage.setItem(KEY, opt); } catch (e) {}
    try {
      var u = new URL(location.href);
      u.searchParams.set('option', opt);
      history.replaceState(null, '', u);
    } catch (e) {}
    syncLinks(opt);
  }

  function syncLinks(opt) {
    document.querySelectorAll('[data-keep-option]').forEach(function (a) {
      var base = a.getAttribute('href').split('?')[0].split('#')[0];
      var hash = a.getAttribute('href').split('#')[1];
      a.setAttribute('href', base + '?option=' + opt + (hash ? '#' + hash : ''));
    });
  }

  root.classList.add('js');
  apply(pick(), false);

  document.addEventListener('DOMContentLoaded', function () {
    var current = root.getAttribute('data-option');
    syncLinks(current);
    document.querySelectorAll('.review-bar input[name="option"]').forEach(function (r) {
      r.checked = r.value === current;
      r.addEventListener('change', function () { if (r.checked) { apply(r.value, true); document.dispatchEvent(new CustomEvent('optionchange')); } });
    });
  });
})();
