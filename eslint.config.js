// @ts-check
import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
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
  // type-aware: the rules that need to know what a value is (floating promises, unsafe any,
  // conditions that are always true), from the project's own tsconfig
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  astro.configs.recommended,
  astro.configs["jsx-a11y-strict"],
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      // noUncheckedIndexedAccess is on; the drawings index fixed-shape layout tables, where `!`
      // says "this index exists" more honestly than a fallback value would.
      "@typescript-eslint/no-non-null-assertion": "off",
      // numbers in template strings (SVG coordinates, CSS values) are the whole point here
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      // `() => void promise` and `() => fn()` are how this code says "the result is unused"
      "@typescript-eslint/no-confusing-void-expression": [
        "error",
        { ignoreArrowShorthand: true, ignoreVoidOperator: true },
      ],
      // `cls || undefined`: an empty string or a zero means "leave the attribute out"
      "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        { ignorePrimitives: { string: true, number: true } },
      ],
      eqeqeq: ["error", "smart"],
      // `role="list"` restores list semantics that Safari drops when list-style is none.
      "astro/jsx-a11y/no-redundant-roles": ["error", { ul: ["list"], ol: ["list"] }],
      // a scrollable <pre> must be focusable so keyboard users can scroll it
      "astro/jsx-a11y/no-noninteractive-tabindex": ["error", { tags: ["pre"], roles: ["region"] }],
      "no-console": ["error", { allow: ["info", "warn", "error"] }],
    },
  },
  // Astro components and plain JS are linted without types (the Astro parser has none to give)
  {
    files: ["**/*.astro", "**/*.js", "**/*.mjs", "**/*.cjs"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
