/**
 * Puts the drawings in motion. The markup already holds every drawing in its final frame
 * (that is what no-JS and reduced-motion visitors see); this only animates.
 *
 * Case studies: a `.scenes` section holds `.scene-step`s, each with a figure and its text.
 *   - From the stage breakpoint up, the figures move into one sticky `.scenes__stage` and
 *     cross-fade as the steps scroll past; progress is how far the active step has scrolled.
 *   - Below it, each figure stays above its step and plays as it scrolls through the viewport.
 *   Steps can share a drawing (`data-scene` repeats) and play a slice of it (`data-range`).
 * Live drawings (`[data-card]`: the project cards and case-study heroes) loop on a clock
 * instead, a little faster while their card is hovered or focused.
 *
 * Everything runs on the page's one scheduler, and only while something is on screen. An
 * animator is built ahead of time, when its drawing comes within a screen of the viewport, in
 * idle time and a few at a time, so a scene never stalls the frame it first appears in.
 * Each frame reads every position first and then writes, and allocates nothing.
 */
import { breakpoint } from "~/styles/tokens";
import { animators } from "./registry";
import { approach, clamp } from "./math";
import type { Scheduler } from "./scheduler";
import type { Animator } from "./types";

interface Player {
  /** Built ahead of time (see build()), or on the first frame it's needed at the latest. */
  run: Animator | null;
  svg: SVGSVGElement;
  factory: (svg: SVGSVGElement) => Animator;
  /** Smoothed progress (-1 before the first frame). */
  ps: number;
  t: number;
  speed: number;
  speedTarget: number;
}

interface Item {
  step: HTMLElement;
  id: string;
  /** The slice of the drawing's timeline this step plays. */
  from: number;
  to: number;
  fig: HTMLElement;
  player: Player;
  home: Node;
  next: Node | null;
  seen: boolean;
  /** This frame's progress, when it's on screen on a narrow layout (-1: not playing). */
  p: number;
}

interface Section {
  el: HTMLElement;
  stage: HTMLElement | null;
  steps: HTMLElement[];
  /** The item for each step, by index (steps without a drawing have none). */
  byStep: (Item | undefined)[];
  items: Item[];
  /** The first item per drawing id: its figure is the one that moves to the stage. */
  primary: Map<string, Item>;
  wide: boolean | null;
  visible: boolean;
  active: Item | null;
  /** This frame's job on a wide layout: which item plays, at what progress. */
  job: Item | null;
  jobP: number;
}

function player(root: Element, id: string): Player | null {
  const svg = root.querySelector<SVGSVGElement>("svg.scene-svg");
  const factory = animators[id];
  if (!svg || !factory) return null;
  return { run: null, svg, factory, ps: -1, t: 0, speed: 1, speedTarget: 1 };
}

/* Building animators in idle time, a few per idle period. */
const queue: Player[] = [];
let idleQueued = false;
const idle: (cb: (d: { timeRemaining: () => number }) => void) => void =
  "requestIdleCallback" in window
    ? (cb) => void requestIdleCallback(cb, { timeout: 600 })
    : (cb) => void setTimeout(() => cb({ timeRemaining: () => 8 }), 50);

function drain(d: { timeRemaining: () => number }): void {
  idleQueued = false;
  // at least one per callback, so a busy page still gets there
  do {
    const a = queue.shift();
    if (a) a.run ??= a.factory(a.svg);
  } while (queue.length && d.timeRemaining() > 6);
  if (queue.length) build();
}

/** Queues players to be built in idle time (no-op for those already built or queued). */
function build(...players: Player[]): void {
  for (const a of players) if (!a.run && !queue.includes(a)) queue.push(a);
  if (queue.length && !idleQueued) {
    idleQueued = true;
    idle(drain);
  }
}

/** Advances a player one frame. Scroll progress is smoothed so a jumpy wheel reads as one motion. */
function tick(a: Player, p: number, dt: number): void {
  a.run ??= a.factory(a.svg);
  if (a.ps < 0) a.ps = p;
  else a.ps += (p - a.ps) * approach(dt, 7);
  if (Math.abs(a.ps - p) < 0.0005) a.ps = p;
  a.speed += (a.speedTarget - a.speed) * approach(dt, 4);
  a.t += dt * a.speed;
  a.run(a.ps, dt * a.speed, a.t, a.speed);
}

function watch(el: Element, margin: string, onChange: (visible: boolean) => void): void {
  new IntersectionObserver((entries) => entries.forEach((e) => onChange(e.isIntersecting)), {
    rootMargin: margin,
  }).observe(el);
}

/** Calls `near` once, when the element first comes within a screen height of the viewport. */
function approaching(el: Element, near: () => void): void {
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      near();
    },
    { rootMargin: "100% 0px" },
  );
  io.observe(el);
}

function setupSection(el: HTMLElement, wake: () => void): Section | null {
  const steps = [...el.querySelectorAll<HTMLElement>(".scene-step")];
  const primary = new Map<string, Item>();
  const items: Item[] = [];
  const byStep: (Item | undefined)[] = [];
  for (const step of steps) {
    const id = step.dataset["scene"] ?? "";
    const [from = 0, to = 1] = (step.dataset["range"] ?? "0 1").split(" ").map(Number);
    const fig = step.querySelector<HTMLElement>(".scene");
    byStep.push(undefined);
    if (!fig) continue;
    // a step that continues an earlier drawing gets its own (decorative) copy for narrow screens
    const first = primary.get(id);
    if (!fig.querySelector("svg") && first) {
      const copy = first.fig.querySelector("svg")!.cloneNode(true) as SVGSVGElement;
      copy.removeAttribute("role");
      copy.removeAttribute("aria-label");
      copy.setAttribute("aria-hidden", "true");
      fig.appendChild(copy);
    }
    const p = player(fig, id);
    if (!p) continue;
    const item: Item = {
      step,
      id,
      from,
      to,
      fig,
      player: p,
      home: fig.parentNode!,
      next: fig.nextSibling,
      seen: false,
      p: -1,
    };
    items.push(item);
    byStep[byStep.length - 1] = item;
    if (!first) primary.set(id, item);
  }
  if (!items.length) return null;
  const S: Section = {
    el,
    stage: el.querySelector(".scenes__stage"),
    steps,
    byStep,
    items,
    primary,
    wide: null,
    visible: false,
    active: null,
    job: null,
    jobP: 0,
  };
  watch(el, "10% 0px", (v) => {
    S.visible = v;
    if (v) wake();
  });
  for (const it of items) {
    watch(it.fig, "5% 0px", (v) => {
      it.seen = v;
      if (v) wake();
    });
  }
  // build the animators this layout will use before the section scrolls into view
  approaching(el, () =>
    build(...(S.wide ? [...S.primary.values()].map((it) => it.player) : items.map((it) => it.player))),
  );
  return S;
}

/** Moves the primary figures into the sticky stage on wide screens, and back on narrow ones. */
function layout(S: Section, wide: boolean): void {
  const staged = wide && !!S.stage;
  if (staged === S.wide) return;
  S.wide = staged;
  S.el.classList.toggle("is-staged", staged);
  S.active = null;
  for (const it of S.primary.values()) {
    if (staged) S.stage!.appendChild(it.fig);
    else
      it.home.insertBefore(it.fig, it.next && it.next.parentNode === it.home ? it.next : it.home.firstChild);
  }
}

/** Reads one section's positions and decides this frame's progress. No writes. */
function readSection(S: Section, vh: number): boolean {
  S.job = null;
  if (S.wide) {
    if (!S.visible) return false;
    // the step whose top has passed the middle of the window plays
    let idx = 0,
      top = 0,
      height = 1;
    for (let i = 0; i < S.steps.length; i++) {
      const r = S.steps[i]!.getBoundingClientRect();
      if (i === 0 || r.top <= vh * 0.5) {
        if (S.byStep[i] || i === 0) {
          idx = i;
          top = r.top;
          height = r.height;
        }
      } else break;
    }
    const it = S.byStep[idx] ?? S.items[0]!;
    // the first step only starts once the stage is pinned (section top at the header)
    const lead = idx === 0 ? Math.max(0, vh * 0.5 - 64) : 0;
    const local = clamp((vh * 0.5 - lead - top) / Math.max(1, height - vh * 0.25 - lead), 0, 1);
    S.job = it;
    S.jobP = it.from + (it.to - it.from) * local;
    return true;
  }
  let any = false;
  for (const it of S.items) {
    if (!it.seen) {
      it.p = -1;
      continue;
    }
    const r = it.fig.getBoundingClientRect();
    it.p = it.from + (it.to - it.from) * clamp((vh * 0.92 - r.top) / (vh * 0.6), 0, 1);
    any = true;
  }
  return any;
}

/** Plays one section's frame: the stage hand-off, then the animators. */
function writeSection(S: Section, dt: number): void {
  const it = S.job;
  if (it) {
    if (S.active !== it) {
      for (const st of S.steps) st.classList.toggle("is-active", st === it.step);
      const fig = S.primary.get(it.id)!.fig;
      for (const f of S.stage!.children) f.classList.toggle("is-on", f === fig);
      S.active = it;
    }
    tick(S.primary.get(it.id)!.player, S.jobP, dt);
    return;
  }
  for (const x of S.items) if (x.p >= 0) tick(x.player, x.p, dt);
}

/**
 * Print shows each figure with its step, in its final frame (the build-time drawing): the
 * stage gives its figures back and the runtime's inline styles are set aside until printing
 * is over. Returns whether printing is under way.
 */
function printing(sections: Section[], relayout: () => void, wake: () => void): () => boolean {
  let on = false;
  const saved = new Map<SVGElement, string>();
  const start = (): void => {
    if (on) return;
    on = true;
    sections.forEach((S) => layout(S, false));
    for (const el of document.querySelectorAll<SVGElement>(".scene-svg [style], .scene-svg[style]")) {
      saved.set(el, el.style.cssText);
      el.style.cssText = "";
    }
  };
  const end = (): void => {
    if (!on) return;
    on = false;
    for (const [el, css] of saved) el.style.cssText = css;
    saved.clear();
    relayout();
    wake();
  };
  addEventListener("beforeprint", start);
  addEventListener("afterprint", end);
  const media = matchMedia("print");
  media.addEventListener("change", () => (media.matches ? start() : end()));
  return () => on;
}

export function startMotion(scheduler: Scheduler): void {
  const wake = (): void => scheduler.wake();
  const sections = [...document.querySelectorAll<HTMLElement>(".scenes")]
    .map((el) => setupSection(el, wake))
    .filter((s): s is Section => !!s);

  const wide = matchMedia(`(min-width: ${breakpoint.stage}px)`);
  const relayout = (): void => {
    sections.forEach((S) => layout(S, wide.matches));
    wake();
  };
  if (sections.length) {
    document.documentElement.classList.add("js-scenes");
    relayout();
    wide.addEventListener("change", relayout);
  }
  const isPrinting = printing(sections, relayout, wake);

  const cards = [...document.querySelectorAll<HTMLElement>("[data-card]")].flatMap((box) => {
    const p = player(box, box.dataset["card"] ?? "");
    if (!p) return [];
    const card = { player: p, seen: false };
    // the card it belongs to: a hover or focus anywhere on it speeds the drawing up
    const host = box.closest("[data-card-host]") ?? box.closest("a") ?? box;
    const faster = (): void => void (p.speedTarget = 1.7);
    const normal = (): void => void (p.speedTarget = 1);
    host.addEventListener("pointerenter", faster);
    host.addEventListener("pointerleave", normal);
    host.addEventListener("focusin", faster);
    host.addEventListener("focusout", normal);
    approaching(box, () => build(p));
    watch(box, "0px", (v) => {
      card.seen = v;
      if (v) wake();
    });
    return [card];
  });

  scheduler.add((dt) => {
    if (isPrinting()) return false;
    const vh = window.innerHeight;
    let busy = false;
    // every read first...
    for (const S of sections) if (readSection(S, vh)) busy = true;
    // ...then every write
    for (const S of sections) writeSection(S, dt);
    for (const c of cards) {
      if (!c.seen) continue;
      busy = true;
      tick(c.player, 0, dt);
    }
    return busy;
  });
}
