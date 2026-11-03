/* Wandpaneel: option switch + the few live readouts. Progressive enhancement:
   every element below already contains sensible static text in the HTML. */
(() => {
  const root = document.documentElement;
  root.classList.remove('no-js');
  const OPTIONS = ['daylight', 'oled', 'e-ink'];
  const KEY = 'wandpaneel-option';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- options */
  function initial() {
    const q = new URLSearchParams(location.search).get('option');
    if (OPTIONS.includes(q)) return q;
    try { const s = localStorage.getItem(KEY); if (OPTIONS.includes(s)) return s; } catch (e) {}
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'oled' : 'daylight';
  }
  function apply(opt, user) {
    const prev = root.dataset.option;
    root.dataset.option = opt;
    $$('input[data-option-input]').forEach(i => { i.checked = i.value === opt; });
    if (!user) return;
    try { localStorage.setItem(KEY, opt); } catch (e) {}
    const u = new URL(location.href); u.searchParams.set('option', opt);
    history.replaceState(null, '', u);
    keepOption();
    if (opt === 'e-ink' && prev !== opt && !reduce.matches) {
      root.classList.remove('is-refreshing'); void root.offsetWidth; root.classList.add('is-refreshing');
      setTimeout(() => root.classList.remove('is-refreshing'), 340);
    }
  }
  function keepOption() {
    $$('a[data-keep-option]').forEach(a => { const h = new URL(a.href); h.searchParams.set('option', root.dataset.option); a.href = h; });
  }
  apply(initial(), false);
  keepOption();
  document.addEventListener('change', e => {
    if (e.target.matches('input[data-option-input]')) apply(e.target.value, true);
  });

  /* ---------- tabs (no JS: all panels stay visible, stacked) */
  $$('[data-tabs]').forEach(box => {
    const tabs = $$('[role="tab"]', box), panels = $$('[role="tabpanel"]', box);
    const select = (i, focus) => {
      tabs.forEach((t, j) => { const on = i === j; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; panels[j].hidden = !on; });
      if (focus) tabs[i].focus();
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', e => {
        const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (k) { e.preventDefault(); select((i + k + tabs.length) % tabs.length, true); }
        if (e.key === 'Home') { e.preventDefault(); select(0, true); }
        if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
      });
    });
    select(0);
  });

  /* ---------- Rotterdam clock */
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', hourCycle: 'h23',
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' });
  const now = () => {
    const p = {}; fmt.formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
    return { h: +p.hour, m: +p.minute, s: +p.second, wd: p.weekday, day: p.day, month: p.month, tz: p.timeZoneName,
      weekend: p.weekday === 'Saturday' || p.weekday === 'Sunday' };
  };
  const pad = n => String(n).padStart(2, '0');
  const hm = mins => pad(Math.floor(mins / 60) % 24) + ':' + pad(Math.round(mins % 60));
  const set = (sel, txt) => $$(sel).forEach(el => { if (el.textContent !== txt) el.textContent = txt; });

  /* "Guus is": a guess from the clock. No tracking. Weekday / weekend schedule in minutes. */
  const WEEKDAY = [[0, 420, 'asleep', 'sleep'], [420, 510, 'commuting', 'move'], [510, 1050, 'at Harborn', 'work'],
    [1050, 1110, 'commuting', 'move'], [1110, 1440, 'home', 'home']];
  const WEEKEND = [[0, 480, 'asleep', 'sleep'], [480, 1440, 'home', 'home']];
  const NOTES = { asleep: 'The homelab isn’t.', commuting: 'Rotterdam, by bike or metro.',
    'at Harborn': 'Client work, platforms, the plumbing in between.', home: 'Probably tinkering with the homelab.' };

  /* Approximate Rotterdam sunset per month, local time, in minutes (illustrative). */
  const SUNSET = [1010, 1065, 1125, 1235, 1285, 1320, 1315, 1265, 1195, 1120, 1025, 990];
  const RUNS = [8, 10, 12, 14, 16, 18, 20, 22];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function renderDay(t, mins) {
    const sched = t.weekend ? WEEKEND : WEEKDAY;
    const cur = sched.find(s => mins >= s[0] && mins < s[1]) || sched[0];
    set('[data-state]', cur[2]);
    set('[data-state-note]', `Since ${hm(cur[0])}, until ${cur[1] === 1440 ? 'midnight' : hm(cur[1])}. ${NOTES[cur[2]]} Guessed from the clock, not tracked.`);
    $$('[data-day]').forEach(bar => {
      if (bar.dataset.day !== (t.weekend ? 'weekend' : 'weekday')) {
        bar.dataset.day = t.weekend ? 'weekend' : 'weekday';
        bar.querySelector('.day__track').innerHTML = sched.map(s =>
          `<span class="day__seg day__seg--${s[3]}" style="--h:${s[1] - s[0]}" title="${s[2]} ${hm(s[0])}–${hm(s[1])}"></span>`).join('');
        set('[data-day-label]', t.weekend ? 'Weekend' : 'Weekday');
      }
      bar.querySelector('.day__now').style.setProperty('--now', (mins / 1440 * 100).toFixed(2) + '%');
    });
  }

  function renderFinder(mins) {
    let next = RUNS.find(h => h * 60 > mins);
    const diff = next !== undefined ? next * 60 - mins : 1440 - mins + RUNS[0] * 60;
    const d = Math.ceil(diff);
    if (next === undefined) {
      set('[data-finder-pre]', 'Next run, tomorrow');
      set('[data-finder]', '08:00'); set('[data-finder-unit]', '');
    } else if (d < 60) {
      set('[data-finder-pre]', 'Next run in');
      set('[data-finder]', String(d)); set('[data-finder-unit]', 'min');
    } else {
      set('[data-finder-pre]', 'Next run in');
      set('[data-finder]', `${Math.floor(d / 60)}:${pad(d % 60)}`); set('[data-finder-unit]', 'h');
    }
    $$('[data-runs] li').forEach(li => {
      const h = +li.dataset.h;
      li.classList.toggle('is-done', h * 60 <= mins);
      li.classList.toggle('is-next', h === (next ?? RUNS[0]));
    });
  }

  function renderLights(t, mins) {
    const mi = MONTHS.indexOf(t.month);
    const sunset = SUNSET[mi < 0 ? 10 : mi];
    const on = mins >= sunset || mins < 360;
    set('[data-lights]', on ? '20%' : 'Off');
    set('[data-lights-note]', on ? 'Hallway, since sunset' : `Hallway, 20% from ~${hm(sunset)}`);
    $$('[data-lights-row]').forEach(r => r.classList.toggle('is-on', on));
  }

  let lastMin = -1;
  function tick() {
    const t = now();
    const mins = t.h * 60 + t.m + t.s / 60;
    set('[data-clock]', `${pad(t.h)}:${pad(t.m)}`);
    set('[data-clock-s]', ':' + pad(t.s));
    if (t.m !== lastMin) {
      lastMin = t.m;
      set('[data-date]', `${t.wd} ${t.day} ${t.month}`);
      set('[data-date-short]', `${t.wd.slice(0, 3)} ${t.day} ${t.month.slice(0, 3)}`);
      set('[data-tz]', `${t.tz === 'CEST' ? 'CEST · UTC+2' : 'CET · UTC+1'}`);
      renderDay(t, mins); renderFinder(mins); renderLights(t, mins);
    } else {
      $$('[data-day] .day__now').forEach(n => n.style.setProperty('--now', (mins / 1440 * 100).toFixed(2) + '%'));
    }
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- k3s real use drifts between 2 and 4 GB (illustrative) */
  const use = $$('[data-ram-use]');
  if (use.length) {
    let gb = 3.1;
    const draw = () => {
      use.forEach(el => el.style.setProperty('--use', (gb / 16 * 100).toFixed(2) + '%'));
      set('[data-ram-use-label]', gb.toFixed(1));
    };
    draw();
    if (!reduce.matches) setInterval(() => {
      if (root.dataset.option === 'e-ink') return;
      gb = Math.min(3.9, Math.max(2.2, gb + (Math.random() - 0.5) * 0.4)); draw();
    }, 4000);
  }
})();
