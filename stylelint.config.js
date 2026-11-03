/** @type {import("stylelint").Config} */
export default {
  extends: ["stylelint-config-standard", "stylelint-config-html/astro"],
  ignoreFiles: [".claude/**", "dist/**", "design/**", "src/styles/tokens.css"],
  rules: {
    // BEM-ish names with double underscores and modifiers (block__el, block--mod).
    "selector-class-pattern": [
      "^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z0-9]+(-[a-z0-9]+)*)?(--[a-z0-9]+(-[a-z0-9]+)*)?$",
      { message: "Use lowercase BEM: block__element--modifier" },
    ],
    "custom-property-pattern": null,
    "import-notation": "string",
    "selector-pseudo-class-no-unknown": [true, { ignorePseudoClasses: ["global"] }],
    "keyframes-name-pattern": null,
    // oklch() channels read better as percentages next to the token file.
    "lightness-notation": null,
    "hue-degree-notation": null,
    "alpha-value-notation": null,
    "color-function-alias-notation": null,
    "no-descending-specificity": null,
    "declaration-block-single-line-max-declarations": null,
  },
};
