/**
 * Puts the drawings in motion. The markup already holds every drawing in its final frame
 * (that is what no-JS and reduced-motion visitors see); this only animates.
 *
 * Case studies: a `.scenes` section holds `.scene-step`s, each with a figure and its text.
 *   - From the stage breakpoint up, the figures move into one sticky `.scenes__stage` and
 *     cross-fade as the steps scroll past; progress is how far the active step has scrolled.
 *   - Below it, each figure stays above its step and plays as it scrolls through the viewport.
 *   Steps can share a drawing (`data-scene` repeats) and play a slice of it (`data-range`).
 * Live drawings (`[data-card]`: the project cards and case-study heroes) play one pass on a
 * clock instead, the first time they're seen: about four seconds, then a moment to settle,
 * and they rest on their final frame (WCAG 2.2.2: nothing moves for more than five seconds
 * unasked). Hovering or focusing the card plays it again, a little faster; so does a tap on
 * the drawing.
 *
 * A scroll scene moves while the reader scrolls. Once its progress has stood still (and the page
 * hasn't scrolled) for REST seconds, it settles: no new packets, the ones on their way fade out,
 * the LEDs and every clock-driven wobble stop, and when nothing is left moving it isn't ticked
 * again until the next scroll (WCAG 2.2.2). With nothing left to tick, the loop sleeps.
 *
 * Everything runs on the page's one scheduler, and only while something is on screen. An
 * animator is built ahead of time, when its drawing comes within a screen of the viewport, in
 * idle time and a few at a time, so a scene never stalls the frame it first appears in.
 * Each frame reads every position first and then writes, and allocates nothing. An animator
 * that throws (when it's built, or in a frame) is reported, its drawing goes back to its still,
 * and everything else keeps moving.
 */
import { media, px } from "~/styles/tokens";
import { toStill } from "./dom";
import { approach, clamp } from "./math";
import type { Scheduler } from "./scheduler";
import type { Animator, SceneFactory } from "./types";

interface Player {
  /** Built ahead of time (see build()), or on the first frame it's needed at the latest. */
  run: Animator | null;
  /** Its drawing id, for the error report. */
  id: string;
  /** It threw: it shows its still and is never ticked again. */
  broken: boolean;
  svg: SVGSVGElement;
  factory: (svg: SVGSVGElement) => Animator;
  /** The progress it was last asked for, and when that (or the page's scroll) last changed (ms). */
  target: number;
  since: number;
  /** It has settled and has nothing left to move (see REST). */
  asleep: boolean;
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

/** This page's animators, by drawing id (registry.ts loads them; startMotion() sets them). */
let animators: Record<string, SceneFactory> = {};

function player(root: Element, id: string): Player | null {
  const svg = root.querySelector<SVGSVGElement>("svg.scene-svg");
  const factory = animators[id];
  if (!svg || !factory) return null;
  const a: Player = {
    run: null,
    id,
    broken: false,
    svg,
    factory,
    target: -1,
    since: 0,
    asleep: false,
    ps: -1,
    t: 0,
    speed: 1,
    speedTarget: 1,
  };
  all.push(a);
  return a;
}

/** Every player on the page (the scroll handler stirs them all). */
const all: Player[] = [];

/**
 * How long (ms, on the wall clock) a scroll scene's progress stands still before it settles.
 * Its last packets fade out and its pods finish within about half a second more, so it is
 * still well inside the five seconds WCAG 2.2.2 allows, also on a slow phone.
 */
const REST = 3500;

/** Takes a failed animator out of play: says so, and puts its drawing back to the still. */
function fail(a: Player, error: unknown): void {
  a.broken = true;
  a.run = null;
  console.error(`motion: the "${a.id}" animator threw; its drawing stays still`, error);
  toStill(a.svg);
}

/** Builds a player's animator now, unless it's built or broken. Returns whether it can run. */
function ready(a: Player): a is Player & { run: Animator } {
  if (a.broken) return false;
  if (!a.run) {
    try {
      a.run = a.factory(a.svg);
    } catch (error) {
      fail(a, error);
      return false;
    }
  }
  return true;
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
    if (a) ready(a);
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

/**
 * Advances a scroll scene one frame. Scroll progress is smoothed so a jumpy wheel reads as one
 * motion. Returns whether it wants another frame: false once it has settled (see REST).
 */
function tick(a: Player, p: number, dt: number, now: number): boolean {
  if (!ready(a)) return false;
  if (Math.abs(p - a.target) > 1e-4) {
    a.target = p;
    a.since = now;
  }
  const rest = now - a.since >= REST;
  if (rest && a.asleep) return false;
  a.asleep = false;
  if (a.ps < 0) a.ps = p;
  else a.ps += (p - a.ps) * approach(dt, 7);
  if (Math.abs(a.ps - p) < 0.0005) a.ps = p;
  a.speed += (a.speedTarget - a.speed) * approach(dt, 4);
  // the clock behind the wobbles (a waiting packet, a spinner) stands still once it rests
  if (!rest) a.t += dt * a.speed;
  let moving: boolean;
  try {
    moving = a.run(a.ps, dt * a.speed, a.t, a.speed, rest);
  } catch (error) {
    fail(a, error);
    return false;
  }
  if (rest && !moving && a.ps === p) a.asleep = true;
  return !a.asleep;
}

/** The reader scrolled: every scene wakes up (and stays awake for another REST). */
function stir(): void {
  const now = performance.now();
  for (const a of all) {
    a.since = now;
    a.asleep = false;
  }
}

/** A card's pass, in seconds at normal speed, and the settling after it (still ticking at p = 1). */
const PASS = 4.2,
  SETTLE = 0.8;

/** Advances a live card one frame. Returns whether it is still moving. */
function tickCard(c: { player: Player; at: number }, dt: number): boolean {
  const a = c.player;
  if (!ready(a)) return false;
  a.speed += (a.speedTarget - a.speed) * approach(dt, 4);
  c.at = Math.min(PASS + SETTLE, c.at + dt * a.speed);
  a.t += dt * a.speed;
  try {
    a.run(Math.min(1, c.at / PASS), dt * a.speed, a.t, a.speed, false);
  } catch (error) {
    fail(a, error);
    return false;
  }
  return c.at < PASS + SETTLE;
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
  const section: Section = {
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
    section.visible = v;
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
    build(
      ...(section.wide ? [...section.primary.values()].map((it) => it.player) : items.map((it) => it.player)),
    ),
  );
  return section;
}

/** Moves the primary figures into the sticky stage on wide screens, and back on narrow ones. */
function layout(section: Section, wide: boolean): void {
  const staged = wide && !!section.stage;
  if (staged === section.wide) return;
  section.wide = staged;
  section.el.classList.toggle("is-staged", staged);
  section.active = null;
  for (const it of section.primary.values()) {
    if (staged) section.stage!.appendChild(it.fig);
    else it.home.insertBefore(it.fig, it.next?.parentNode === it.home ? it.next : it.home.firstChild);
  }
}

/** Reads one section's positions and decides this frame's progress. No writes. */
function readSection(section: Section, vh: number): void {
  section.job = null;
  if (section.wide) {
    if (!section.visible) return;
    // the step whose top has passed the middle of the window plays
    let idx = 0,
      top = 0,
      height = 1;
    for (let i = 0; i < section.steps.length; i++) {
      const r = section.steps[i]!.getBoundingClientRect();
      if (i === 0 || r.top <= vh * 0.5) {
        if (section.byStep[i] || i === 0) {
          idx = i;
          top = r.top;
          height = r.height;
        }
      } else break;
    }
    const it = section.byStep[idx] ?? section.items[0]!;
    // the first step only starts once the stage is pinned (section top at the header)
    const lead = idx === 0 ? Math.max(0, vh * 0.5 - px["space-header"]) : 0;
    const local = clamp((vh * 0.5 - lead - top) / Math.max(1, height - vh * 0.25 - lead), 0, 1);
    section.job = it;
    section.jobP = it.from + (it.to - it.from) * local;
    return;
  }
  for (const it of section.items) {
    if (!it.seen) {
      it.p = -1;
      continue;
    }
    const r = it.fig.getBoundingClientRect();
    it.p = it.from + (it.to - it.from) * clamp((vh * 0.92 - r.top) / (vh * 0.6), 0, 1);
  }
}

/** Plays one section's frame: the stage hand-off, then the animators. Returns whether any is still moving. */
function writeSection(section: Section, dt: number, now: number): boolean {
  const it = section.job;
  if (it) {
    if (section.active !== it) {
      for (const st of section.steps) st.classList.toggle("is-active", st === it.step);
      const fig = section.primary.get(it.id)!.fig;
      for (const f of section.stage!.children) f.classList.toggle("is-on", f === fig);
      section.active = it;
    }
    return tick(section.primary.get(it.id)!.player, section.jobP, dt, now);
  }
  let busy = false;
  for (const x of section.items) if (x.p >= 0 && tick(x.player, x.p, dt, now)) busy = true;
  return busy;
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
    sections.forEach((section) => layout(section, false));
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
  const print = matchMedia("print");
  print.addEventListener("change", () => (print.matches ? start() : end()));
  return () => on;
}

/** Starts every drawing on the page, with the animators registry.ts loaded for it. */
export function startMotion(scheduler: Scheduler, pageAnimators: Record<string, SceneFactory>): void {
  animators = pageAnimators;
  const wake = (): void => scheduler.wake();
  const sections = [...document.querySelectorAll<HTMLElement>(".scenes")]
    .map((el) => setupSection(el, wake))
    .filter((s): s is Section => !!s);

  const wide = matchMedia(media.stage);
  const relayout = (): void => {
    sections.forEach((section) => layout(section, wide.matches));
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
    const card = { player: p, seen: false, at: 0 };
    // plays the pass again, unless it's still playing (then it only changes speed)
    const replay = (speed: number): void => {
      p.speedTarget = speed;
      if (card.at >= PASS) card.at = 0;
      wake();
    };
    // the card it belongs to: a hover or focus anywhere on it replays the drawing, faster
    const host = box.closest("[data-card-host]") ?? box.closest("a") ?? box;
    host.addEventListener("pointerenter", (e) => {
      if ((e as PointerEvent).pointerType !== "touch") replay(1.7);
    });
    host.addEventListener("pointerleave", () => void (p.speedTarget = 1));
    host.addEventListener("focusin", () => replay(1.7));
    host.addEventListener("focusout", () => void (p.speedTarget = 1));
    // on a touch screen, a tap on the drawing itself
    box.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") replay(1);
    });
    approaching(box, () => build(p));
    watch(box, "0px", (v) => {
      card.seen = v;
      if (v) wake();
    });
    return [card];
  });

  if (sections.length) {
    // a scroll (or a resize, which moves the steps) wakes the scenes that have settled
    const onScroll = (): void => {
      stir();
      wake();
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
  }

  scheduler.add((dt) => {
    if (isPrinting()) return false;
    const vh = window.innerHeight,
      now = performance.now();
    let busy = false;
    // every read first...
    for (const section of sections) readSection(section, vh);
    // ...then every write
    for (const section of sections) if (writeSection(section, dt, now)) busy = true;
    for (const c of cards) if (c.seen && c.at < PASS + SETTLE && tickCard(c, dt)) busy = true;
    return busy;
  });
}
