/**
 * Puts the drawings in motion. The markup already holds every drawing in its final frame
 * (that is what no-JS and reduced-motion visitors see); this only animates.
 *
 * Case studies: a `.scenes` section holds `.scene-step`s, each with a figure and its text.
 *   - From the stage breakpoint up, the figures move into one sticky `.scenes__stage` and
 *     cross-fade as the steps scroll past; progress is how far the active step has scrolled.
 *   - Below it, each figure stays above its step and plays as it scrolls through the viewport.
 *   Steps can share a drawing (`data-scene` repeats) and play a slice of it (`data-range`).
 * Homepage cards (`[data-card]`) loop on a clock instead, a little faster on hover or focus.
 *
 * Everything runs on the page's one scheduler, and only while something is on screen.
 */
import { breakpoint } from "~/styles/tokens";
import { animators } from "./registry";
import { approach, clamp } from "./math";
import type { Scheduler } from "./scheduler";
import type { Animator } from "./types";

interface Player {
  /** Built on the first frame the drawing is on screen, so a page doesn't pay for them all up front. */
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
}

interface Section {
  el: HTMLElement;
  stage: HTMLElement | null;
  steps: HTMLElement[];
  items: Item[];
  /** The first item per drawing id: its figure is the one that moves to the stage. */
  primary: Map<string, Item>;
  wide: boolean | null;
  visible: boolean;
  active: Item | null;
}

function player(root: Element, id: string): Player | null {
  const svg = root.querySelector<SVGSVGElement>("svg.scene-svg");
  const factory = animators[id];
  if (!svg || !factory) return null;
  return { run: null, svg, factory, ps: -1, t: 0, speed: 1, speedTarget: 1 };
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

function setupSection(el: HTMLElement, wake: () => void): Section | null {
  const steps = [...el.querySelectorAll<HTMLElement>(".scene-step")];
  const primary = new Map<string, Item>();
  const items: Item[] = [];
  for (const step of steps) {
    const id = step.dataset["scene"] ?? "";
    const [from = 0, to = 1] = (step.dataset["range"] ?? "0 1").split(" ").map(Number);
    const fig = step.querySelector<HTMLElement>(".scene");
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
    };
    items.push(item);
    if (!first) primary.set(id, item);
  }
  if (!items.length) return null;
  const S: Section = {
    el,
    stage: el.querySelector(".scenes__stage"),
    steps,
    items,
    primary,
    wide: null,
    visible: false,
    active: null,
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
  return S;
}

/** Moves the primary figures into the sticky stage on wide screens, and back on narrow ones. */
function layout(S: Section, wide: boolean): void {
  const staged = wide && !!S.stage;
  if (staged === S.wide) return;
  S.wide = staged;
  S.el.classList.toggle("is-staged", staged);
  for (const it of S.primary.values()) {
    if (staged) S.stage!.appendChild(it.fig);
    else
      it.home.insertBefore(it.fig, it.next && it.next.parentNode === it.home ? it.next : it.home.firstChild);
  }
}

/** Progress jobs for one frame. All rects are read first, then everything is written. */
function sectionJobs(S: Section, vh: number): [Section | null, Item, number][] {
  if (S.wide) {
    if (!S.visible) return [];
    const rects = S.steps.map((st) => st.getBoundingClientRect());
    let idx = 0;
    rects.forEach((r, i) => {
      if (r.top <= vh * 0.5) idx = i;
    });
    const it = S.items.find((x) => x.step === S.steps[idx]) ?? S.items[0]!;
    const r = rects[S.steps.indexOf(it.step)]!;
    // the first step only starts once the stage is pinned (section top at the header)
    const lead = idx === 0 ? Math.max(0, vh * 0.5 - 64) : 0;
    const local = clamp((vh * 0.5 - lead - r.top) / Math.max(1, r.height - vh * 0.25 - lead), 0, 1);
    return [[S, it, it.from + (it.to - it.from) * local]];
  }
  return S.items
    .filter((it) => it.seen)
    .map((it) => {
      const r = it.fig.getBoundingClientRect();
      return [null, it, it.from + (it.to - it.from) * clamp((vh * 0.92 - r.top) / (vh * 0.6), 0, 1)];
    });
}

export function startMotion(scheduler: Scheduler): void {
  const wake = (): void => scheduler.wake();
  const sections = [...document.querySelectorAll<HTMLElement>(".scenes")]
    .map((el) => setupSection(el, wake))
    .filter((s): s is Section => !!s);

  if (sections.length) {
    const wide = matchMedia(`(min-width: ${breakpoint.stage}px)`);
    document.documentElement.classList.add("js-scenes");
    const relayout = (): void => {
      sections.forEach((S) => layout(S, wide.matches));
      wake();
    };
    relayout();
    wide.addEventListener("change", relayout);
  }

  const cards = [...document.querySelectorAll<HTMLElement>("[data-card]")].flatMap((box) => {
    const p = player(box, box.dataset["card"] ?? "");
    if (!p) return [];
    const card = { player: p, seen: false };
    const link = box.closest("a") ?? box;
    const faster = (): void => void (p.speedTarget = 1.7);
    const normal = (): void => void (p.speedTarget = 1);
    link.addEventListener("pointerenter", faster);
    link.addEventListener("pointerleave", normal);
    link.addEventListener("focus", faster);
    link.addEventListener("blur", normal);
    watch(box, "0px", (v) => {
      card.seen = v;
      if (v) wake();
    });
    return [card];
  });

  scheduler.add((dt) => {
    const vh = window.innerHeight;
    let busy = false;
    const jobs = sections.flatMap((S) => {
      const j = sectionJobs(S, vh);
      if (S.wide ? S.visible : j.length) busy = true;
      return j;
    });
    for (const [S, it, p] of jobs) {
      if (S && S.active !== it) {
        S.steps.forEach((st) => st.classList.toggle("is-active", st === it.step));
        const fig = S.primary.get(it.id)!.fig;
        for (const f of S.stage!.children) f.classList.toggle("is-on", f === fig);
        S.active = it;
      }
      tick(S ? S.primary.get(it.id)!.player : it.player, p, dt);
    }
    for (const c of cards) {
      if (!c.seen) continue;
      busy = true;
      tick(c.player, 0, dt);
    }
    return busy;
  });
}
