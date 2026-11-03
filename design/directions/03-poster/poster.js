/* 03-poster "Affiche": option switch + fitted-type safety net. Progressive enhancement only. */
(() => {
  const OPTIONS = ['rotterdam', 'polder', 'nachtdruk'];
  const KEY = 'affiche-option';
  const root = document.documentElement;

  const store = {
    get() { try { return localStorage.getItem(KEY); } catch { return null; } },
    set(v) { try { localStorage.setItem(KEY, v); } catch { /* private mode: fine */ } },
  };

  function apply(opt, persist) {
    if (!OPTIONS.includes(opt)) return;
    root.dataset.option = opt;
    document.querySelectorAll('.review-bar input[name="option"]').forEach((i) => { i.checked = i.value === opt; });
    document.querySelectorAll('[data-current-option]').forEach((n) => { n.textContent = opt; });
    if (persist) {
      store.set(opt);
      const url = new URL(location.href);
      url.searchParams.set('option', opt);
      history.replaceState(null, '', url);
    }
  }

  // Initial option: the inline head script already set it; sync the controls.
  apply(root.dataset.option || 'rotterdam', false);

  document.querySelectorAll('.review-bar input[name="option"]').forEach((input) => {
    input.addEventListener('change', () => apply(input.value, true));
  });

  // Fitted type. CSS sizes it with container units, measured for Anybody.
  // If the webfont did not load, the fallback has different widths: refit by measuring.
  function refit() {
    document.querySelectorAll('.fit').forEach((el) => {
      el.style.fontSize = '';
      const box = el.parentElement;
      const cs = getComputedStyle(box);
      const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const w = el.scrollWidth;
      if (w > 0 && Math.abs(w - avail) / avail > 0.01) {
        el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * avail / w).toFixed(2) + 'px';
      }
    });
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (document.fonts.check('900 16px Anybody')) return;
      refit();
      let t;
      addEventListener('resize', () => { clearTimeout(t); t = setTimeout(refit, 120); });
    });
  }
})();
