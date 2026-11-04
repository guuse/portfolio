/**
 * The top-level blocks of a page: the children of <main>, looking through its `div.wrap`
 * wrappers, and through the hero's, which holds About on the homepage. A block always has a
 * box, even where its content isn't rendered yet (content-visibility on the homepage), so code
 * that must not render a far part of the page reads, or watches, the block instead.
 */
const BLOCK =
  "main > :not(div.wrap, .hero), main > div.wrap > *, .hero > :not(div.wrap), .hero > div.wrap > *";

/** The top-level block `el` is in (or is), if it's in one. */
export const blockOf = (el: Element): Element | null => el.closest(BLOCK);
