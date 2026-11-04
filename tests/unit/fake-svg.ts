/**
 * Just enough of the SVG DOM to build and run the animators in Node: the markup the kit
 * renders, parsed into elements that answer the calls src/lib/motion makes (parts by data-k,
 * class lists, attributes, inline styles, cloning and inserting nodes). Every real change is
 * counted, like a MutationObserver would see it, so a test can tell a drawing that has come
 * to rest from one that is still being written to.
 */

/** Writes that would show up as mutations in a browser. */
export const writes = { n: 0 };

class FakeClassList {
  constructor(private readonly el: FakeElement) {}
  private get list(): string[] {
    return (this.el.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);
  }
  contains(c: string): boolean {
    return this.list.includes(c);
  }
  toggle(c: string, force?: boolean): boolean {
    const has = this.contains(c),
      want = force ?? !has;
    if (want !== has)
      this.el.setAttribute("class", (want ? [...this.list, c] : this.list.filter((x) => x !== c)).join(" "));
    return want;
  }
  add(c: string): void {
    this.toggle(c, true);
  }
  /** Like the DOM, remove() rewrites the attribute even when the class wasn't there. */
  remove(c: string): void {
    this.el.setAttribute("class", this.list.filter((x) => x !== c).join(" "));
  }
}

export class FakeElement {
  readonly attrs = new Map<string, string>();
  readonly children: FakeElement[] = [];
  parentNode: FakeElement | null = null;
  readonly classList = new FakeClassList(this);
  readonly style: Record<string, string> = new Proxy<Record<string, string>>(
    {},
    {
      set(target, key: string, value: string) {
        if (target[key] !== value) writes.n++;
        target[key] = value;
        return true;
      },
    },
  );

  constructor(readonly localName: string) {}

  getAttribute(name: string): string | null {
    return this.attrs.get(name) ?? null;
  }
  setAttribute(name: string, value: string): void {
    writes.n++;
    this.attrs.set(name, value);
  }
  removeAttribute(name: string): void {
    if (this.attrs.delete(name)) writes.n++;
  }
  hasAttribute(name: string): boolean {
    return this.attrs.has(name);
  }
  appendChild<T extends FakeElement>(child: T): T {
    child.parentNode?.removeChild(child);
    child.parentNode = this;
    this.children.push(child);
    writes.n++;
    return child;
  }
  removeChild<T extends FakeElement>(child: T): T {
    const i = this.children.indexOf(child);
    if (i < 0) throw new Error("not a child");
    this.children.splice(i, 1);
    child.parentNode = null;
    writes.n++;
    return child;
  }
  remove(): void {
    this.parentNode?.removeChild(this);
  }
  after(node: FakeElement): void {
    const parent = this.parentNode!;
    node.parentNode?.removeChild(node);
    parent.children.splice(parent.children.indexOf(this) + 1, 0, node);
    node.parentNode = parent;
    writes.n++;
  }
  cloneNode(deep = false): FakeElement {
    const c = new FakeElement(this.localName);
    for (const [k, v] of this.attrs) c.attrs.set(k, v);
    if (deep) for (const ch of this.children) c.appendChild(ch.cloneNode(true));
    return c;
  }
  getBBox(): { x: number; y: number; width: number; height: number } {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  *descendants(): Generator<FakeElement> {
    for (const ch of this.children) {
      yield ch;
      yield* ch.descendants();
    }
  }
  /** Supports what the runtime asks: `tag`, `.class`, `[attr]` and combinations, comma-separated. */
  querySelectorAll(selector: string): FakeElement[] {
    const tests = selector.split(",").map((part) => {
      const s = part.trim();
      const tag = /^[a-z]+/i.exec(s)?.[0];
      const classes = [...s.matchAll(/\.([\w-]+)/g)].map((m) => m[1]!);
      const attrs = [...s.matchAll(/\[([\w-]+)\]/g)].map((m) => m[1]!);
      if (/[\s>:~+]/.test(s.replace(/\[[^\]]*\]/g, "")))
        throw new Error(`fake-svg: unsupported selector ${s}`);
      return (el: FakeElement) =>
        (!tag || el.localName === tag) &&
        classes.every((c) => el.classList.contains(c)) &&
        attrs.every((a) => el.hasAttribute(a));
    });
    return [...this.descendants()].filter((el) => tests.some((t) => t(el)));
  }
  querySelector(selector: string): FakeElement | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }
}

/** Parses the kit's markup (well-formed, double-quoted attributes) into a fake <svg>. */
export function parseSvg(markup: string): FakeElement {
  const root = new FakeElement("#root");
  let at = root;
  for (const m of markup.matchAll(/<(\/?)([\w:-]+)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g)) {
    const [, close, name, attrs, self] = m;
    if (close) {
      at = at.parentNode!;
      continue;
    }
    const el = new FakeElement(name!);
    for (const a of attrs!.matchAll(/([\w:-]+)="([^"]*)"/g)) el.attrs.set(a[1]!, a[2]!);
    at.children.push(el);
    el.parentNode = at;
    if (!self) at = el;
  }
  const svg = root.children[0]!;
  svg.parentNode = null;
  return svg;
}

/** The data-k keys a parsed drawing has. */
export const keysOf = (svg: FakeElement): Set<string> =>
  new Set(svg.querySelectorAll("[data-k]").map((el) => el.getAttribute("data-k")!));

/** Installs a `document` that makes fake elements (packets, lit routes, pulses). */
export function installDocument(): void {
  (globalThis as { document?: unknown }).document = {
    createElementNS: (_ns: string, tag: string) => new FakeElement(tag),
  };
}
