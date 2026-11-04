/**
 * Small things for people who poke around. None of them gets in the way.
 *   - The console has a postcard for whoever opens devtools.
 *   - `?` opens a sheet of keyboard shortcuts; `g` then a letter jumps to a page.
 *   - The Konami code untaps everything: cards and prints turn sideways and back.
 * The shortcuts are single character keys, so the sheet can turn them off (WCAG 2.1.4): then
 * nothing listens to the keyboard but Alt + ?, which opens the sheet to turn them back on.
 */
import { site } from "~/lib/site";
import { ms } from "~/styles/tokens";
import { motionOk } from "./motion-ok";

const POSTCARD = String.raw`
   ┌──────────────────────────────────────────┐
   │  ekkelenkamp.dev                     ▢   │
   │                                          │
   │  Greetings from Rotterdam.               │
   │  Built with Astro, shipped by Argo CD,   │
   │  served from a laptop under the TV.      │
   └──────────────────────────────────────────┘`;

function postcard(): void {
  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  console.info(`%c${POSTCARD}`, `font-family: monospace; color: ${accent}`);
  console.info(`Looking at the source? It’s on GitHub: ${site.repo}. Mail: ${site.email}`);
  console.info("Press ? for keyboard shortcuts.");
}

/** Two-key "go to" shortcuts, like a mail client. */
const GO: Record<string, string> = {
  h: "/",
  p: "/projects/",
  e: "/#experience",
  c: "/#contact",
  d: "/design-system/",
};

const typing = (e: KeyboardEvent): boolean => {
  const t = e.target as HTMLElement | null;
  return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
};

/* Whether the character-key shortcuts are on. Storage can be missing or blocked: then on. */
const STORE = "shortcuts";
function readEnabled(): boolean {
  try {
    return localStorage.getItem(STORE) !== "off";
  } catch {
    return true;
  }
}
function saveEnabled(on: boolean): void {
  try {
    if (on) localStorage.removeItem(STORE);
    else localStorage.setItem(STORE, "off");
  } catch {
    /* not remembered, but it still applies to this page */
  }
}
let enabled = readEnabled();

/** Alt + ? (Option + ? on a Mac, where the key reads "¿"), the one combo that always works. */
const altQuestion = (e: KeyboardEvent): boolean =>
  e.altKey && !e.ctrlKey && !e.metaKey && (e.key === "?" || (e.code === "Slash" && e.shiftKey));

function shortcuts(): void {
  const sheet = document.querySelector<HTMLDialogElement>("dialog.keys");
  const toggle = sheet?.querySelector<HTMLButtonElement>("[data-keys-toggle]");
  const show = (): void => {
    if (!toggle || !sheet) return;
    toggle.textContent = enabled ? "Turn shortcuts off" : "Turn shortcuts on";
    sheet.querySelector<HTMLElement>("[data-keys-on]")!.hidden = !enabled;
    sheet.querySelector<HTMLElement>("[data-keys-off]")!.hidden = enabled;
  };
  show();
  toggle?.addEventListener("click", () => {
    enabled = !enabled;
    saveEnabled(enabled);
    show();
  });
  let pendingGo = 0;
  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || typing(e) || document.querySelector("dialog[open]:not(.keys)")) return;
    if (sheet && (altQuestion(e) || (enabled && e.key === "?" && !e.altKey && !e.ctrlKey && !e.metaKey))) {
      e.preventDefault();
      if (sheet.open) sheet.close();
      else sheet.showModal();
      return;
    }
    if (!enabled || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "g") {
      pendingGo = Date.now();
      return;
    }
    const href = GO[e.key];
    if (href && Date.now() - pendingGo < 1200) {
      pendingGo = 0;
      sheet?.close();
      location.assign(href);
    }
  });
  sheet?.addEventListener("click", (e) => {
    if (e.target === sheet || (e.target as Element).closest("[data-keys-close]")) sheet.close();
  });
}

const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

/**
 * Shows a message in the page's toast: a role="status" node that is in the page from the
 * start, so screen readers announce what is written into it.
 */
let toastTimer = 0;
function toast(message: string): void {
  const el = document.querySelector<HTMLElement>("[data-toast]");
  if (!el) return;
  clearTimeout(toastTimer);
  el.classList.remove("is-shown");
  el.textContent = message;
  el.getBoundingClientRect(); // a reflow, so the animation restarts if it is still running
  el.classList.add("is-shown");
  toastTimer = window.setTimeout(() => {
    el.classList.remove("is-shown");
    el.textContent = "";
  }, ms.toast);
}

function konami(): void {
  let at = 0;
  document.addEventListener("keydown", (e) => {
    if (!enabled || typing(e)) return;
    // once ↑↑ has started the code, the arrows that carry it on don't scroll the page too;
    // any other arrow (and every arrow before then) scrolls as usual
    if (at >= 2 && e.key === KONAMI[at] && e.key.startsWith("Arrow") && !e.altKey && !e.ctrlKey && !e.metaKey)
      e.preventDefault();
    // a third ↑ (or a fourth) still leaves ↑↑ typed: the code goes on from there
    if (at >= 2 && e.key === KONAMI[0] && KONAMI[at] !== KONAMI[0]) at = 2;
    else at = e.key.toLowerCase() === KONAMI[at]!.toLowerCase() ? at + 1 : e.key === KONAMI[0] ? 1 : 0;
    if (at < KONAMI.length) return;
    at = 0;
    if (motionOk()) {
      const root = document.documentElement;
      root.classList.remove("is-untapping");
      root.getBoundingClientRect(); // a reflow, so the animation restarts if it is still running
      root.classList.add("is-untapping");
      // a frame or so after the animation (the same token) has finished
      setTimeout(() => root.classList.remove("is-untapping"), ms.untap + 100);
    }
    toast("Untapped.");
  });
}

export function initEasterEggs(): void {
  // nobody needs it soon: it waits for an idle moment (and reads the style once it's clean)
  if ("requestIdleCallback" in window) requestIdleCallback(postcard, { timeout: 3000 });
  else setTimeout(postcard, 1000);
  shortcuts();
  konami();
}
