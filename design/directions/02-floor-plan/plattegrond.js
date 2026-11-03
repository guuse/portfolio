/* 02 · Plattegrond: option switch, room lights, plan ↔ schedule hover, current room. ~4 KB, no deps. */
(function () {
  var root = document.documentElement;
  var OPTIONS = ['daylight', 'blueprint', 'lights-out'];
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- review bar: options */
  function setOption(name, persist) {
    if (OPTIONS.indexOf(name) < 0) return;
    root.setAttribute('data-option', name);
    document.querySelectorAll('.review-bar input[name="option"]').forEach(function (i) { i.checked = i.value === name; });
    if (persist) {
      try { localStorage.setItem('pg-option', name); } catch (e) {}
      try { var u = new URL(location.href); u.searchParams.set('option', name); history.replaceState(null, '', u); } catch (e) {}
    }
  }
  setOption(root.getAttribute('data-option'), false);
  document.querySelectorAll('.review-bar input[name="option"]').forEach(function (i) {
    i.addEventListener('change', function () { if (i.checked) setOption(i.value, true); });
  });

  /* ---------- lights */
  var plan = document.querySelector('svg.plan:not(.plan--detail)');
  var status = document.querySelectorAll('[data-lights-status]');
  var state = {};
  document.querySelectorAll('[data-light]').forEach(function (b) { state[b.dataset.light] = b.getAttribute('aria-pressed') === 'true'; });

  function paint(room) {
    var on = !!state[room];
    {
      document.querySelectorAll('svg.plan [data-room="' + room + '"].room, svg.plan .bulb[data-room="' + room + '"], svg.plan [data-switch="' + room + '"]').forEach(function (el) {
        el.classList.toggle('is-lit', on);
      });
    }
    document.querySelectorAll('[data-light="' + room + '"]').forEach(function (b) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); });
  }
  function count() { return Object.keys(state).filter(function (k) { return state[k]; }).length; }
  function report(msg) {
    var n = count(), total = Object.keys(state).length;
    status.forEach(function (s) { s.textContent = msg || (n + ' of ' + total + ' lights on'); });
    document.querySelectorAll('[data-scene="away"]').forEach(function (b) {
      b.querySelector('span').textContent = n ? 'Last phone leaves' : 'Someone comes home';
    });
  }
  function toggle(room) { state[room] = !state[room]; paint(room); report(); }

  document.querySelectorAll('[data-light]').forEach(function (b) {
    b.addEventListener('click', function () { toggle(b.dataset.light); });
  });
  if (plan) {
    plan.querySelectorAll('[data-switch]').forEach(function (g) {
      g.addEventListener('click', function (e) { e.preventDefault(); toggle(g.dataset.switch); });
    });
  }

  var memory = null;
  document.querySelectorAll('[data-scene="away"]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lit = Object.keys(state).filter(function (k) { return state[k]; });
      var step = reduce.matches ? 0 : 160;
      if (lit.length) {
        memory = lit;
        lit.forEach(function (k, i) { setTimeout(function () { state[k] = false; paint(k); if (i === lit.length - 1) report('Everything off. The house is empty.'); }, i * step); });
      } else {
        var back = memory && memory.length ? memory : ['hal', 'woon'];
        back.forEach(function (k, i) { setTimeout(function () { state[k] = true; paint(k); if (i === back.length - 1) report(); }, i * step); });
      }
    });
  });

  /* ---------- hover sync: schedule rows ↔ plan rooms */
  function hot(room, on) {
    if (plan) plan.querySelectorAll('a.room[data-room="' + room + '"]').forEach(function (a) { a.classList.toggle('is-hot', on); });
    document.querySelectorAll('.roomlist li[data-room="' + room + '"]').forEach(function (li) { li.classList.toggle('is-hot', on); });
  }
  document.querySelectorAll('.roomlist li[data-room]').forEach(function (li) {
    ['mouseenter', 'focusin'].forEach(function (ev) { li.addEventListener(ev, function () { hot(li.dataset.room, true); }); });
    ['mouseleave', 'focusout'].forEach(function (ev) { li.addEventListener(ev, function () { hot(li.dataset.room, false); }); });
  });
  if (plan) {
    plan.querySelectorAll('a.room').forEach(function (a) {
      a.addEventListener('mouseenter', function () { hot(a.dataset.room, true); });
      a.addEventListener('mouseleave', function () { hot(a.dataset.room, false); });
    });
  }

  /* ---------- compact plan crop on phones */
  if (plan && plan.dataset.viewboxCompact) {
    var full = plan.getAttribute('viewBox');
    var mq = window.matchMedia('(max-width: 599px)');
    var crop = function () { plan.setAttribute('viewBox', mq.matches ? plan.dataset.viewboxCompact : full); };
    crop();
    if (mq.addEventListener) mq.addEventListener('change', crop);
  }

  /* ---------- current room in the header nav */
  var links = {};
  document.querySelectorAll('.site-nav a[href^="#"]').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        Object.keys(links).forEach(function (id) { links[id].removeAttribute('aria-current'); });
        if (links[en.target.id]) links[en.target.id].setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main > section[id]').forEach(function (s) { io.observe(s); });
  }
  report();
})();
