/**
 * Page to page view transitions (motion.css): only one project's drawing carries over, the
 * one the navigation is about. Going into a case study it's that project; coming back out of
 * one (to the homepage or the projects list) it's the project you're leaving. Every other
 * drawing is part of the page's crossfade, and so are the titles.
 *
 * The choice is two classes on <html>: `vt-only` (name nothing by default) and `vt-<project>`
 * (except this one). The old page sets them as it is captured (pageswap) and the new one as
 * it is revealed (pagereveal); both come off when the transition is over. A new page can be
 * revealed before this module runs (a module waits for the HTML to finish parsing); then its
 * drawings keep their default names and the ones without a partner simply fade in with the
 * page (motion.css), so the result looks the same.
 */
const CASE = /^\/projects\/([a-z0-9-]+)\/$/;

const slugOf = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.origin === location.origin ? (CASE.exec(u.pathname)?.[1] ?? null) : null;
  } catch {
    return null;
  }
};

/** The project a navigation from `from` to `to` is about: the case study it enters, or leaves. */
const subject = (from: string | null | undefined, to: string | null | undefined): string | null =>
  slugOf(to) ?? slugOf(from);

const root = document.documentElement;
const mark = (slug: string | null, done: Promise<unknown> | undefined): void => {
  const added = ["vt-only", ...(slug ? [`vt-${slug}`] : [])];
  root.classList.add(...added);
  void done?.finally(() => root.classList.remove(...added));
};

interface SwapEvent extends Event {
  viewTransition: ViewTransition | null;
  activation: { entry: { url: string | null } } | null;
}
interface RevealEvent extends Event {
  viewTransition: ViewTransition | null;
}
/** The Navigation API, which not every browser has (the DOM types assume it's always there). */
interface MaybeNavigation {
  navigation?: {
    activation?: { from?: { url: string | null } | null; entry: { url: string | null } } | null;
  };
}

export function initPageTransitions(): void {
  addEventListener("pageswap", (e) => {
    const ev = e as SwapEvent;
    if (!ev.viewTransition) return;
    mark(subject(location.href, ev.activation?.entry.url), ev.viewTransition.finished);
  });
  addEventListener("pagereveal", (e) => {
    const ev = e as RevealEvent;
    if (!ev.viewTransition) return;
    const act = (window as MaybeNavigation).navigation?.activation;
    mark(subject(act?.from?.url, act?.entry.url ?? location.href), ev.viewTransition.finished);
  });
}
