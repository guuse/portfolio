/**
 * Small things for people who poke around. None of them gets in the way.
 *   - The console has a postcard for whoever opens devtools.
 *   - `?` opens a sheet of keyboard shortcuts; `g` then a letter jumps to a page.
 *   - The Konami code untaps everything: cards and prints turn sideways and back.
 */
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
  console.info(`%c${POSTCARD}`, "font-family: monospace; color: #fbc044");
  console.info("Snooping? Same. ekkelenkampguus@gmail.com");
  console.info("Hint: press ? for shortcuts. Old cheat codes still work here.");
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

function shortcuts(): void {
  const sheet = document.querySelector<HTMLDialogElement>("dialog.keys");
  let pendingGo = 0;
  document.addEventListener("keydown", (e) => {
    if (
      e.defaultPrevented ||
      e.metaKey ||
      e.ctrlKey ||
      e.altKey ||
      typing(e) ||
      document.querySelector("dialog[open]:not(.keys)")
    )
      return;
    if (e.key === "?" && sheet) {
      e.preventDefault();
      if (sheet.open) sheet.close();
      else sheet.showModal();
      return;
    }
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

function toast(message: string): void {
  const el = document.createElement("p");
  el.className = "toast";
  el.setAttribute("role", "status");
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function konami(): void {
  let at = 0;
  document.addEventListener("keydown", (e) => {
    if (typing(e)) return;
    at = e.key.toLowerCase() === KONAMI[at]!.toLowerCase() ? at + 1 : e.key === KONAMI[0] ? 1 : 0;
    if (at < KONAMI.length) return;
    at = 0;
    if (motionOk()) {
      const root = document.documentElement;
      root.classList.remove("is-untapping");
      void root.offsetWidth; // restart the animation if it is still running
      root.classList.add("is-untapping");
      setTimeout(() => root.classList.remove("is-untapping"), 1600);
    }
    toast("Untap, upkeep, draw. Your turn.");
  });
}

export function initEasterEggs(): void {
  postcard();
  shortcuts();
  konami();
}
