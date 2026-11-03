// @ts-check
import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".claude/",
      "dist/",
      ".astro/",
      "design/",
      "node_modules/",
      "playwright-report/",
      "test-results/",
      ".lighthouseci/",
      "src/styles/tokens.*",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  ...astro.configs.recommended,
  ...astro.configs["jsx-a11y-strict"],
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // noUncheckedIndexedAccess is on; the drawings index fixed-shape layout tables, where `!`
      // says "this index exists" more honestly than a fallback value would.
      "@typescript-eslint/no-non-null-assertion": "off",
      eqeqeq: ["error", "smart"],
      // `role="list"` restores list semantics that Safari drops when list-style is none.
      "astro/jsx-a11y/no-redundant-roles": ["error", { ul: ["list"], ol: ["list"] }],
      "no-console": ["error", { allow: ["info", "warn", "error"] }],
    },
  },
);
