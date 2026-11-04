/**
 * lighthouserc.cjs keeps its own copy of the page list (a .cjs config can't import the .ts);
 * this keeps the copy equal to tests/pages.ts, so a new page gets a Lighthouse budget too.
 */
import { createRequire } from "node:module";
import { expect, it } from "vitest";
import { PAGES } from "../pages";

const require = createRequire(import.meta.url);
const lhci = require("../../lighthouserc.cjs") as { pages: string[]; ci: { collect: { url: string[] } } };

it("audits exactly the pages in tests/pages.ts, in the same order", () => {
  expect(lhci.pages).toEqual([...PAGES]);
  expect(lhci.ci.collect.url.map((u) => new URL(u).pathname)).toEqual([...PAGES]);
});
