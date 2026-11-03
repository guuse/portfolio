/*
 * r2-beeld · animated diagrams (round 6).
 * Seven technical diagrams that explain how things work. Each has a full layout (wide
 * containers) and a compact one (narrow containers, ≤ 620px), picked by a container query.
 * They animate only while in view, loop calmly, and replay on hover. With
 * prefers-reduced-motion they show their final, fully labelled state and stay still.
 *
 * Exports window.BeeldDiagrams = { html(id), mount(root) } (and module.exports for the build).
 */
(function (root) {
  "use strict";

  /* ------------------------------------------------------------------ glyphs */
  // 20×20, stroke-based, drawn to sit at 1.5px. Colour comes from currentColor.
  var G = {
    git: '<circle cx="6" cy="5" r="2"/><circle cx="6" cy="15" r="2"/><circle cx="14" cy="8" r="2"/><path d="M6 7v6M14 10c0 3-4 3-8 3"/>',
    box: '<path d="M3 6.5 10 3l7 3.5v7L10 17l-7-3.5z"/><path d="M3 6.5 10 10l7-3.5M10 10v7"/>',
    tag: '<path d="M3 3h7l7 7-7 7-7-7z"/><circle cx="7" cy="7" r="1.3"/>',
    sync: '<path d="M16 7a7 7 0 0 0-12 1M4 13a7 7 0 0 0 12-1M16 3v4h-4M4 17v-4h4"/>',
    lock: '<rect x="4" y="9" width="12" height="9" rx="2"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/>',
    shield: '<path d="M10 2.5 16.5 5v5c0 4-3 6.6-6.5 7.5C6.5 16.6 3.5 14 3.5 10V5z"/><path d="m7 10 2 2 4-4"/>',
    cloud: '<path d="M6 15h9a3.5 3.5 0 0 0 0-7 5 5 0 0 0-9.6 1.6A2.8 2.8 0 0 0 6 15z"/>',
    bucket: '<ellipse cx="10" cy="5" rx="6" ry="2.5"/><path d="M4 5v10c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V5"/>',
    chart: '<path d="M3 17h14M6 14v-4M10 14V6M14 14V9"/>',
    laptop: '<rect x="4" y="5" width="12" height="8" rx="1"/><path d="M2 15.5h16"/>',
    user: '<circle cx="10" cy="7" r="3"/><path d="M4 17c1-4 11-4 12 0"/>',
    users: '<circle cx="7.5" cy="7.5" r="2.5"/><circle cx="13.5" cy="8.5" r="2"/><path d="M3 16c.8-3.4 8.2-3.4 9 0M12 15c.5-2 4.5-2.3 5.5 0"/>',
    globe: '<circle cx="10" cy="10" r="7"/><path d="M3 10h14M10 3c3 3 3 11 0 14M10 3c-3 3-3 11 0 14"/>',
    check: '<path d="m5 10 3 3 7-7"/>',
    cross: '<path d="m6 6 8 8M14 6l-8 8"/>',
    merge: '<circle cx="6" cy="4" r="2"/><circle cx="6" cy="16" r="2"/><circle cx="14" cy="16" r="2"/><path d="M6 6v8M6 8c0 4 8 3 8 6"/>',
    eye: '<path d="M2 10c4-6 12-6 16 0-4 6-12 6-16 0z"/><circle cx="10" cy="10" r="2.5"/>',
    gauge: '<path d="M3.5 14a6.5 6.5 0 1 1 13 0"/><path d="m10 14 3-4"/>',
    rocket: '<path d="M10 2c4 3 5 8 3 12H7C5 10 6 5 10 2z"/><path d="m7 14-2 4M13 14l2 4"/><circle cx="10" cy="8" r="1.5"/>',
    pod: '<path d="M10 3 16 6.5v7L10 17l-6-3.5v-7z"/>',
    radio: '<circle cx="10" cy="13" r="1.5"/><path d="M6.5 9.5a5 5 0 0 1 7 0M4 7a8.5 8.5 0 0 1 12 0"/>',
    tunnel: '<path d="M3 16V9a7 7 0 0 1 14 0v7"/><path d="M7 16v-5a3 3 0 0 1 6 0v5"/>',
    funnel: '<path d="M3 4h14l-6 7v5l-2 1v-6z"/>',
    battery: '<rect x="2" y="6" width="14" height="8" rx="1.5"/><path d="M17.5 9v2"/><path d="M5 9h6v2H5z"/>',
    code: '<path d="M7 6 3 10l4 4M13 6l4 4-4 4"/>',
    bell: '<path d="M10 3c-3 0-5 2-5 5v3l-2 3h14l-2-3V8c0-3-2-5-5-5zM8 17h4"/>',
    gh: '<path d="M10 2.5a7.5 7.5 0 0 0-2.4 14.6c.4 0 .5-.2.5-.4v-1.4c-2.1.5-2.5-1-2.5-1-.4-.9-.9-1.1-.9-1.1-.7-.5 0-.5 0-.5.8.1 1.2.8 1.2.8.7 1.2 1.8.8 2.2.6 0-.5.3-.8.5-1-1.7-.2-3.4-.8-3.4-3.7 0-.8.3-1.5.8-2-.1-.2-.3-1 .1-2 0 0 .6-.2 2 .8a7 7 0 0 1 3.8 0c1.4-1 2-.8 2-.8.4 1 .2 1.8.1 2 .5.5.8 1.2.8 2 0 2.9-1.8 3.5-3.4 3.7.3.2.5.7.5 1.4v2.1c0 .2.1.4.5.4A7.5 7.5 0 0 0 10 2.5z"/>',
    stack: '<path d="m10 3 7 3.5-7 3.5-7-3.5z"/><path d="m3 10 7 3.5 7-3.5M3 13.5 10 17l7-3.5"/>',
    usb: '<rect x="7" y="2" width="6" height="7" rx="1"/><path d="M5 9h10v5a5 5 0 0 1-10 0z"/><path d="M10 16v2"/>'
  };
  function glyph(name, x, y, cls) {
    return '<g class="dg-g' + (cls ? " " + cls : "") + '" transform="translate(' + x + " " + y + ')" aria-hidden="true">' + (G[name] || "") + "</g>";
  }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* ------------------------------------------------------------- primitives */
  // A node: rounded card with a glyph, label and a mono sub-label that steps can rewrite.
  function card(id, b, label, sub, g, extra) {
    extra = extra || {};
    var cx = b.x + 16, gy = b.y + (b.h - 20) / 2;
    var tx = g ? b.x + 48 : b.x + 16;
    var single = !sub;
    return '<g class="dg-n' + (extra.cls ? " " + extra.cls : "") + '" data-n="' + id + '">' +
      '<rect class="dg-card" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="' + (extra.rx || 12) + '"/>' +
      '<rect class="dg-sheen" x="' + (b.x + 1) + '" y="' + (b.y + 1) + '" width="' + (b.w - 2) + '" height="' + Math.min(22, b.h / 2) + '" rx="' + ((extra.rx || 12) - 1) + '"/>' +
      (g ? glyph(g, cx, gy) : "") +
      '<text class="dg-l" x="' + tx + '" y="' + (single ? b.y + b.h / 2 + 5.5 : b.y + b.h / 2 - 3) + '">' + esc(label) + "</text>" +
      (sub ? '<text class="dg-s" data-s x="' + tx + '" y="' + (b.y + b.h / 2 + 16) + '">' + esc(sub) + "</text>" : "") +
      "</g>";
  }
  function group(b, label, cls, g) {
    return '<g class="dg-grp' + (cls ? " " + cls : "") + '"><rect x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="16"/>' +
      (g ? glyph(g, b.x + 14, b.y + 12, "dg-g--grp") : "") +
      '<text class="dg-gl" x="' + (b.x + (g ? 42 : 16)) + '" y="' + (b.y + 27) + '">' + esc(label) + "</text></g>";
  }
  function edge(id, d, cls) {
    return '<g class="dg-e' + (cls ? " " + cls : "") + '" data-e="' + id + '"><path class="dg-e__base" d="' + d + '"/><path class="dg-e__hot" pathLength="100" d="' + d + '"/></g>';
  }
  function label(x, y, s, cls, anchor) {
    return '<text class="' + (cls || "dg-m") + '" x="' + x + '" y="' + y + '"' + (anchor ? ' text-anchor="' + anchor + '"' : "") + ">" + esc(s) + "</text>";
  }
  function pill(id, x, y, w, s, cls, g) {
    return '<g class="dg-pill' + (cls ? " " + cls : "") + '" data-n="' + id + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="30" rx="15"/>' +
      (g ? glyph(g, x + 9, y + 5, "dg-g--sm") : "") +
      '<text x="' + (x + (g ? 32 : w / 2)) + '" y="' + (y + 20) + '"' + (g ? "" : ' text-anchor="middle"') + ">" + esc(s) + "</text></g>";
  }
  function pods(id, x, y, n, gap) {
    var s = '<g class="dg-pods" data-pods="' + id + '">';
    for (var i = 0; i < n; i++) s += '<g class="dg-pod" transform="translate(' + (x + i * (gap || 30)) + " " + y + ')"><path d="M12 1 22 6.8v11.4L12 24 2 18.2V6.8z"/></g>';
    return s + "</g>";
  }
  function env(id, b, name, sub, n, ver) {
    return '<g class="dg-n dg-env" data-n="' + id + '">' +
      '<rect class="dg-card" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h + '" rx="14"/>' +
      '<rect class="dg-sheen" x="' + (b.x + 1) + '" y="' + (b.y + 1) + '" width="' + (b.w - 2) + '" height="22" rx="13"/>' +
      '<text class="dg-l" x="' + (b.x + 18) + '" y="' + (b.y + 30) + '">' + esc(name) + "</text>" +
      '<text class="dg-s" x="' + (b.x + 18) + '" y="' + (b.y + 50) + '">' + esc(sub) + "</text>" +
      pods(id, b.x + 18, b.y + b.h - 44, n, 32) +
      '<text class="dg-v" data-s x="' + (b.x + b.w - 16) + '" y="' + (b.y + b.h - 24) + '" text-anchor="end">' + esc(ver) + "</text></g>";
  }
  function svg(cls, vb, title, body) {
    return '<svg class="dg__svg ' + cls + '" viewBox="' + vb + '" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><g class="dg-root">' + body + '</g><circle class="dg-pk" r="5" cx="-20" cy="-20"/><circle class="dg-pk dg-pk--2" r="4" cx="-20" cy="-20"/></svg>';
  }

  /* ------------------------------------------------------------- diagrams */
  var D = {};

  /* 1. Platform: app delivery (GitOps) */
  D.delivery = {
    title: "App delivery: from commit to production",
    alt: "Diagram: a commit lands in the app's git repo. CI builds and tests it and pushes an image to the registry. Argo CD Image Updater watches the registry, and when a new version appears it commits that version to git. Argo CD syncs from git: a release candidate rolls out to acceptance first; later the stable release is cut and rolls out to production. Version numbers are examples.",
    full: function () {
      return '<rect class="dg-rail" x="20" y="20" width="720" height="48" rx="12"/>' + glyph("git", 34, 34) + label(62, 49, "Git", "dg-l") + label(104, 49, "source of truth", "dg-m") +
        '<g class="dg-n dg-mark" data-n="commit"><circle cx="300" cy="44" r="6"/>' + label(312, 49, "code commit", "dg-m dg-m--ink") + '</g>' +
        '<g class="dg-n dg-mark" data-n="tagged"><circle cx="500" cy="44" r="6"/>' + label(512, 49, "new image version", "dg-m dg-m--ink") + '</g>' +
        edge("c2ci", "M300 68 V90 H100 V112") + edge("ci2reg", "M180 146 H206") + edge("reg2iu", "M356 146 H382") + edge("iu2git", "M467 112 V90 H500 V68") + edge("git2argo", "M659 68 V112") +
        card("ci", { x: 20, y: 112, w: 160, h: 68 }, "CI", "build and test", "box") +
        card("reg", { x: 206, y: 112, w: 150, h: 68 }, "Registry", "images", "tag") +
        card("iu", { x: 382, y: 112, w: 170, h: 68 }, "Image Updater", "watches registry", "eye") +
        card("argo", { x: 578, y: 112, w: 162, h: 68 }, "Argo CD", "in sync", "sync") +
        edge("argo2acc", "M620 180 V204 H185 V226") + edge("argo2prod", "M700 180 V226") +
        env("acc", { x: 20, y: 226, w: 345, h: 132 }, "Acceptance", "follows release candidates", 5, "v2.3.0") +
        env("prod", { x: 395, y: 226, w: 345, h: 132 }, "Production", "follows stable releases", 5, "v2.3.0");
    },
    compact: function () {
      return '<rect class="dg-rail" x="10" y="10" width="320" height="44" rx="12"/>' + glyph("git", 22, 22) + label(50, 37, "Git", "dg-l") +
        '<g class="dg-n dg-mark" data-n="commit"><circle cx="102" cy="32" r="6"/>' + label(112, 37, "commit", "dg-m dg-m--ink") + '</g>' +
        '<g class="dg-n dg-mark" data-n="tagged"><circle cx="196" cy="32" r="6"/>' + label(206, 37, "new version", "dg-m dg-m--ink") + '</g>' +
        edge("c2ci", "M102 54 V80") + edge("ci2reg", "M170 136 V152") + edge("reg2iu", "M170 208 V224") + edge("iu2git", "M300 252 H322 V54") + edge("git2argo", "M22 54 V324 H60") +
        card("ci", { x: 60, y: 80, w: 240, h: 56 }, "CI", "build and test", "box") +
        card("reg", { x: 60, y: 152, w: 240, h: 56 }, "Registry", "images", "tag") +
        card("iu", { x: 60, y: 224, w: 240, h: 56 }, "Image Updater", "watches registry", "eye") +
        card("argo", { x: 60, y: 296, w: 240, h: 56 }, "Argo CD", "in sync", "sync") +
        edge("argo2acc", "M120 352 V372") + edge("argo2prod", "M260 352 V362 H326 V560 H300") +
        env("acc", { x: 10, y: 372, w: 290, h: 118 }, "Acceptance", "release candidates", 4, "v2.3.0") +
        env("prod", { x: 10, y: 502, w: 290, h: 118 }, "Production", "stable releases", 4, "v2.3.0");
    },
    vb: ["0 0 760 380", "0 0 340 636"],
    seq: [
      ["lit", "commit"], ["go", "c2ci", 800], ["lit", "ci"], ["text", "ci", "building 2.4.0-rc.1"], ["wait", 500],
      ["go", "ci2reg", 600], ["lit", "reg"], ["text", "reg", "2.4.0-rc.1 pushed"], ["go", "reg2iu", 600], ["lit", "iu"], ["text", "iu", "new rc found"],
      ["go", "iu2git", 800], ["lit", "tagged"], ["text", "iu", "committed to git"], ["go", "git2argo", 600], ["lit", "argo"], ["text", "argo", "syncing"],
      ["go", "argo2acc", 800], ["roll", "acc", "v2.4.0-rc.1"], ["lit", "acc"], ["text", "argo", "rc in acceptance"], ["wait", 2200],
      ["text", "ci", "release 2.4.0 cut"], ["wait", 500], ["text", "reg", "2.4.0 pushed"], ["go", "reg2iu", 500], ["text", "iu", "stable release found"], ["go", "iu2git", 600], ["text", "iu", "committed to git"],
      ["go", "git2argo", 500], ["text", "argo", "syncing"], ["go", "argo2prod", 800], ["roll", "prod", "v2.4.0"], ["lit", "prod"], ["text", "argo", "in sync"], ["wait", 2800]
    ]
  };

  /* 2. Platform: infrastructure pipeline (Pulumi, push-based GitOps) */
  var STAGES = [["tests", "check"], ["policy", "shield"], ["preview", "eye"], ["review", "users"], ["merge", "merge"], ["drift gate", "gauge"], ["apply", "rocket"]];
  D.infra = {
    title: "Infrastructure pipeline",
    alt: "Diagram: a pull request moves through tests, a mandatory policy check, a saved preview plan, a review by someone other than the author, merge, a drift gate and finally apply. In the first run the policy blocks a public bucket; after the fix every stage passes. A daily drift check runs on the side.",
    full: function () {
      var s = '<path class="dg-track" d="M48 236 H712"/>';
      STAGES.forEach(function (st, i) {
        var x = 20 + i * 104;
        s += '<g class="dg-stage" data-st="' + i + '"><rect x="' + x + '" y="214" width="96" height="88" rx="14"/>' + glyph(st[1], x + 38, 226) +
          '<text class="dg-l dg-l--c" x="' + (x + 48) + '" y="270" text-anchor="middle">' + st[0] + "</text>" +
          '<g class="dg-state"><circle cx="' + (x + 48) + '" cy="290" r="0"/></g>' +
          '<text class="dg-st" data-sts x="' + (x + 48) + '" y="292" text-anchor="middle">waiting</text></g>';
      });
      s += '<g class="dg-pr" data-pr style="--x: 0px"><rect x="20" y="40" width="250" height="118" rx="14"/>' +
        '<rect class="dg-sheen" x="21" y="41" width="248" height="22" rx="13"/>' + glyph("merge", 36, 54) +
        '<text class="dg-l" x="64" y="70">PR #128</text><text class="dg-s" data-prs x="36" y="102">add a storage bucket</text>' +
        '<text class="dg-m" data-prm x="36" y="132">opened by an engineer</text><path class="dg-pr__pin" d="M70 158 V206"/></g>';
      s += pill("drift", 470, 330, 270, "daily drift check: no drift", "dg-pill--pulse", "gauge") + pill("slack", 20, 330, 230, "result posted to Slack", "", "bell");
      return s;
    },
    compact: function () {
      var s = '<g class="dg-pr dg-pr--fixed" data-pr><rect x="10" y="10" width="320" height="92" rx="14"/>' +
        '<rect class="dg-sheen" x="11" y="11" width="318" height="22" rx="13"/>' + glyph("merge", 24, 22) +
        '<text class="dg-l" x="52" y="38">PR #128</text><text class="dg-s" data-prs x="24" y="64">add a storage bucket</text>' +
        '<text class="dg-m" data-prm x="24" y="88">opened by an engineer</text><path class="dg-pr__pin" d="M0 0"/></g>';
      s += '<path class="dg-track" d="M40 118 V520"/>';
      STAGES.forEach(function (st, i) {
        var y = 118 + i * 58;
        s += '<g class="dg-stage" data-st="' + i + '"><rect x="10" y="' + y + '" width="320" height="48" rx="12"/>' + glyph(st[1], 24, y + 14) +
          '<text class="dg-l" x="56" y="' + (y + 30) + '">' + st[0] + "</text>" +
          '<g class="dg-state"><circle cx="0" cy="0" r="0"/></g>' +
          '<text class="dg-st" data-sts x="314" y="' + (y + 29) + '" text-anchor="end">waiting</text></g>';
      });
      s += pill("drift", 10, 538, 320, "daily drift check: no drift", "dg-pill--pulse", "gauge") + pill("slack", 10, 580, 320, "result posted to Slack", "", "bell");
      return s;
    },
    vb: ["0 0 760 380", "0 0 340 622"],
    seq: [
      ["pr", 0, "add a public bucket", "opened by an engineer"], ["stage", 0, "ok", "passed"], ["wait", 500],
      ["pr", 1], ["stage", 1, "bad", "blocked"], ["prbad", true, "fails at preview: public bucket"], ["wait", 1700],
      ["prbad", false, "fixed in a new commit"], ["prtext", "add a private bucket"], ["reset-stages"], ["pr", 0], ["stage", 0, "ok", "passed"], ["wait", 350],
      ["pr", 1], ["stage", 1, "ok", "passed"], ["wait", 350], ["pr", 2], ["stage", 2, "ok", "plan saved"], ["wait", 450],
      ["pr", 3], ["stage", 3, "ok", "approved"], ["prm", "reviewed by a colleague"], ["wait", 450], ["pr", 4], ["stage", 4, "ok", "merged"], ["wait", 350],
      ["pr", 5], ["stage", 5, "ok", "no drift"], ["wait", 450], ["pr", 6], ["stage", 6, "ok", "applied"], ["prm", "applied by the pipeline"], ["lit", "slack"], ["wait", 2800]
    ]
  };

  /* 3. Platform: logging pipeline */
  D.logs = {
    title: "Logging pipeline",
    alt: "Diagram: log lines stream from pods on three nodes into Alloy on each node, then into Loki on a dedicated node pool. Loki stores them in an encrypted object-storage bucket with 90-day retention, owned by Loki's compactor, and Grafana queries them.",
    full: function () {
      var s = "";
      [20, 140, 260].forEach(function (y, i) {
        s += '<g class="dg-n dg-knode" data-n="node' + i + '"><rect class="dg-card" x="20" y="' + y + '" width="250" height="100" rx="14"/>' +
          '<text class="dg-m" x="38" y="' + (y + 28) + '">node ' + (i + 1) + "</text>" + pods("p" + i, 36, y + 44, 3, 30) +
          '<g class="dg-chip" data-n="alloy' + i + '"><rect x="146" y="' + (y + 40) + '" width="108" height="36" rx="10"/>' + glyph("stack", 156, y + 48, "dg-g--sm") + '<text x="184" y="' + (y + 63) + '">Alloy</text></g></g>';
        s += edge("a" + i, "M254 " + (y + 58) + " C 296 " + (y + 58) + ", 286 190, 326 190");
      });
      s += card("loki", { x: 326, y: 150, w: 206, h: 80 }, "Loki", "platform node pool", "stack");
      s += edge("l2b", "M532 176 C 550 176, 540 92, 560 92") + edge("l2g", "M532 206 C 550 206, 540 282, 560 282");
      s += card("bucket", { x: 560, y: 46, w: 180, h: 92 }, "Object storage", "encrypted", "lock");
      s += label(560, 162, "kept 90 days, by Loki", "dg-m dg-m--note");
      s += '<g class="dg-n dg-graf" data-n="grafana"><rect class="dg-card" x="560" y="214" width="180" height="140" rx="14"/>' + glyph("chart", 576, 228) +
        '<text class="dg-l" x="606" y="244">Grafana</text>' +
        [0, 1, 2, 3, 4, 5, 6].map(function (k) { var h = [20, 34, 26, 48, 30, 56, 40][k]; return '<rect class="dg-bar" x="' + (580 + k * 21) + '" y="' + (338 - h) + '" width="13" height="' + h + '" rx="3" style="--d:' + k * 60 + 'ms"/>'; }).join("") +
        "</g>";
      return s;
    },
    compact: function () {
      var s = "";
      [10, 120, 230].forEach(function (x, i) {
        s += '<g class="dg-n dg-knode" data-n="node' + i + '"><rect class="dg-card" x="' + x + '" y="10" width="100" height="120" rx="12"/>' +
          '<text class="dg-m" x="' + (x + 12) + '" y="32">node ' + (i + 1) + "</text>" + pods("p" + i, x + 12, 42, 2, 30) +
          '<g class="dg-chip" data-n="alloy' + i + '"><rect x="' + (x + 10) + '" y="86" width="80" height="32" rx="9"/><text x="' + (x + 50) + '" y="107" text-anchor="middle">Alloy</text></g></g>';
        s += edge("a" + i, "M" + (x + 50) + " 130 C " + (x + 50) + " 160, 170 150, 170 180");
      });
      s += card("loki", { x: 70, y: 180, w: 200, h: 66 }, "Loki", "platform pool", "stack");
      s += edge("l2b", "M130 246 V290") + edge("l2g", "M220 246 V290");
      s += card("bucket", { x: 10, y: 290, w: 150, h: 74 }, "Storage", "encrypted", "lock");
      s += label(10, 386, "kept 90 days", "dg-m dg-m--note");
      s += '<g class="dg-n dg-graf" data-n="grafana"><rect class="dg-card" x="176" y="290" width="154" height="120" rx="12"/><text class="dg-l" x="192" y="316">Grafana</text>' +
        [0, 1, 2, 3, 4, 5].map(function (k) { var h = [16, 30, 22, 40, 26, 46][k]; return '<rect class="dg-bar" x="' + (192 + k * 21) + '" y="' + (398 - h) + '" width="13" height="' + h + '" rx="3" style="--d:' + k * 60 + 'ms"/>'; }).join("") + "</g>";
      return s;
    },
    vb: ["0 0 760 370", "0 0 340 420"],
    seq: [
      ["podsOn", "p0"], ["podsOn", "p1"], ["podsOn", "p2"],
      ["lit", "alloy0"], ["go", "a0", 700], ["lit", "loki"], ["lit", "alloy1"], ["go", "a1", 600], ["lit", "alloy2"], ["go", "a2", 650],
      ["text", "loki", "indexing labels"], ["go", "l2b", 700], ["lit", "bucket"], ["text", "bucket", "one reader only", true],
      ["go", "l2g", 700], ["lit", "grafana"], ["text", "loki", "platform node pool"], ["wait", 2600]
    ]
  };

  /* 4. Platform: where it runs (map strip) */
  // Cluster sizes and positions are illustrative; only the totals are real.
  var CL = { NL: [26, 14, 10, 8], EU: [16, 11, 8], JP: [13] };
  D.map = {
    title: "Where the clusters run",
    alt: "Diagram: eight Kubernetes clusters of different sizes, in the Netherlands, elsewhere in Europe and in Japan. The largest runs more than 1,500 pods. Positions and sizes are illustrative.",
    full: function () {
      var s = '<path class="dg-lat" d="M20 190 H740"/>';
      var zones = [["NL", "the Netherlands", 20, 270], ["EU", "elsewhere in Europe", 306, 250], ["JP", "Japan", 572, 168]];
      zones.forEach(function (z) {
        s += '<g class="dg-zone"><rect x="' + z[2] + '" y="96" width="' + z[3] + '" height="190" rx="16"/>' + glyph("globe", z[2] + 14, 108, "dg-g--grp") + '<text class="dg-gl" x="' + (z[2] + 42) + '" y="123">' + z[1] + "</text></g>";
        var list = CL[z[0]], x = z[2] + 46;
        list.forEach(function (r, k) {
          s += '<g class="dg-cl" style="--d:' + (k * 420 + (z[0] === "EU" ? 200 : z[0] === "JP" ? 500 : 0)) + 'ms"><circle class="dg-cl__ring" cx="' + x + '" cy="210" r="' + r + '"/><circle class="dg-cl__dot" cx="' + x + '" cy="210" r="' + r + '"/></g>';
          x += r * 2 + 22;
        });
      });
      s += '<text class="dg-big" x="20" y="58">8 clusters</text><text class="dg-m" x="190" y="56">small to large, one way of working</text>';
      s += '<path class="dg-callout" d="M66 238 V266 H96"/><text class="dg-m dg-m--ink" x="102" y="270">1,500+ pods</text>';
      s += label(740, 330, "positions and sizes are illustrative", "dg-m dg-m--note", "end");
      return s;
    },
    compact: function () {
      var s = '<text class="dg-big" x="10" y="40">8 clusters</text>';
      var zones = [["NL", "the Netherlands", 64], ["EU", "elsewhere in Europe", 190], ["JP", "Japan", 316]];
      zones.forEach(function (z) {
        s += '<g class="dg-zone"><rect x="10" y="' + z[2] + '" width="320" height="110" rx="14"/><text class="dg-gl" x="26" y="' + (z[2] + 26) + '">' + z[1] + "</text></g>";
        var x = 40;
        CL[z[0]].forEach(function (r, k) {
          s += '<g class="dg-cl" style="--d:' + k * 400 + 'ms"><circle class="dg-cl__ring" cx="' + x + '" cy="' + (z[2] + 68) + '" r="' + r + '"/><circle class="dg-cl__dot" cx="' + x + '" cy="' + (z[2] + 68) + '" r="' + r + '"/></g>';
          x += r * 2 + 18;
        });
      });
      s += '<text class="dg-m dg-m--ink" x="314" y="90" text-anchor="end">largest: 1,500+ pods</text>';
      s += label(10, 448, "positions and sizes are illustrative", "dg-m dg-m--note");
      return s;
    },
    vb: ["0 0 760 340", "0 0 340 460"],
    seq: [["cls", "dg-live", true], ["wait", 6000]]
  };

  /* 5. Homelab: git push to running */
  D.push = {
    title: "From git push to running",
    alt: "Diagram: a git push triggers GitHub Actions, which builds an image tagged with the commit SHA on GHCR. On the laptop under the TV, Argo CD Image Updater notices the new tag and writes it to git, Argo CD syncs, and the pods roll over. The laptop runs with its lid shut, and its battery doubles as a UPS.",
    full: function () {
      return group({ x: 16, y: 16, w: 300, h: 344 }, "GitHub", "", "gh") +
        card("push", { x: 40, y: 64, w: 252, h: 66 }, "git push", "to main", "git") +
        card("actions", { x: 40, y: 166, w: 252, h: 66 }, "GitHub Actions", "build and test", "box") +
        card("ghcr", { x: 40, y: 268, w: 252, h: 66 }, "GHCR", "image registry", "tag") +
        edge("p2a", "M166 130 V166") + edge("a2g", "M166 232 V268") +
        group({ x: 350, y: 16, w: 394, h: 344 }, "the laptop under the TV", "dg-grp--host", "laptop") +
        '<g class="dg-badge"><rect x="594" y="30" width="136" height="26" rx="13"/>' + glyph("battery", 602, 33, "dg-g--sm") + '<text x="628" y="48">battery = UPS</text></g>' +
        card("iu", { x: 374, y: 76, w: 220, h: 66 }, "Image Updater", "watches GHCR", "eye") +
        card("argo", { x: 374, y: 176, w: 220, h: 66 }, "Argo CD", "in sync", "sync") +
        edge("g2iu", "M292 301 H330 V109 H374") + edge("iu2argo", "M484 142 V176") + edge("argo2pods", "M594 209 H640 V262") +
        '<g class="dg-n dg-env dg-env--slim" data-n="run"><rect class="dg-card" x="374" y="262" width="346" height="80" rx="14"/>' +
        '<text class="dg-l" x="392" y="288">pods</text><text class="dg-v" data-s x="702" y="288" text-anchor="end">41f0c2e</text>' + pods("run", 392, 302, 6, 32) + "</g>";
    },
    compact: function () {
      return group({ x: 8, y: 8, w: 324, h: 262 }, "GitHub", "", "gh") +
        card("push", { x: 24, y: 48, w: 292, h: 56 }, "git push", "to main", "git") +
        card("actions", { x: 24, y: 120, w: 292, h: 56 }, "GitHub Actions", "build and test", "box") +
        card("ghcr", { x: 24, y: 192, w: 292, h: 56 }, "GHCR", "image registry", "tag") +
        edge("p2a", "M170 104 V120") + edge("a2g", "M170 176 V192") +
        group({ x: 8, y: 290, w: 324, h: 330 }, "laptop under the TV", "dg-grp--host", "laptop") +
        '<g class="dg-badge"><rect x="212" y="300" width="108" height="26" rx="13"/>' + glyph("battery", 220, 303, "dg-g--sm") + '<text x="246" y="318">UPS</text></g>' +
        card("iu", { x: 24, y: 340, w: 292, h: 56 }, "Image Updater", "watches GHCR", "eye") +
        card("argo", { x: 24, y: 420, w: 292, h: 56 }, "Argo CD", "in sync", "sync") +
        edge("g2iu", "M316 220 H326 V368 H316") + edge("iu2argo", "M170 396 V420") + edge("argo2pods", "M170 476 V500") +
        '<g class="dg-n dg-env dg-env--slim" data-n="run"><rect class="dg-card" x="24" y="500" width="292" height="104" rx="14"/>' +
        '<text class="dg-l" x="40" y="526">pods</text><text class="dg-v" data-s x="300" y="526" text-anchor="end">41f0c2e</text>' + pods("run", 40, 548, 5, 34) + "</g>";
    },
    vb: ["0 0 760 376", "0 0 340 628"],
    seq: [
      ["lit", "push"], ["text", "push", "commit a1c9e2f"], ["go", "p2a", 700], ["lit", "actions"], ["text", "actions", "tests pass, image built"],
      ["go", "a2g", 700], ["lit", "ghcr"], ["text", "ghcr", "image a1c9e2f"], ["go", "g2iu", 1000], ["lit", "iu"], ["text", "iu", "committed to git"],
      ["go", "iu2argo", 600], ["lit", "argo"], ["text", "argo", "syncing"], ["go", "argo2pods", 600], ["roll", "run", "a1c9e2f"], ["lit", "run"], ["text", "argo", "in sync"], ["wait", 2600]
    ]
  };

  /* 6. Homelab: ways in */
  D.ways = {
    title: "Three ways in",
    alt: "Diagram: three ways into the laptop, all opt-in. By default my own devices come in over the private Tailscale network. A few apps are public through a Cloudflare Tunnel with a login in front. For a party, Tailscale Funnel gives a temporary public URL. All of them end at Traefik, which serves one wildcard TLS certificate. There are no open ports.",
    full: function () {
      return card("me", { x: 20, y: 30, w: 200, h: 70 }, "My devices", "phone, laptop", "laptop") +
        card("pub", { x: 20, y: 150, w: 200, h: 70 }, "Visitor", "public, with login", "globe") +
        card("guest", { x: 20, y: 270, w: 200, h: 70 }, "Party guest", "one evening", "users") +
        edge("w1", "M220 65 C 330 65, 360 165, 520 165", "dg-e--t1") +
        edge("w2", "M220 185 H520", "dg-e--t2") +
        edge("w3", "M220 305 C 330 305, 360 205, 520 205", "dg-e--t3") +
        pill("l1", 256, 76, 172, "tailnet, default", "dg-pill--t1", "lock") +
        pill("l2", 256, 152, 182, "Tunnel, opt-in", "dg-pill--t2", "tunnel") +
        pill("l3", 256, 262, 178, "Funnel, opt-in", "dg-pill--t3", "funnel") +
        group({ x: 494, y: 20, w: 250, h: 330 }, "the laptop", "dg-grp--host", "laptop") +
        '<g class="dg-shield" data-n="shield"><circle cx="494" cy="290" r="22"/>' + glyph("shield", 484, 280) + '</g><text class="dg-m dg-m--ink" x="524" y="296">0 open ports</text>' +
        card("traefik", { x: 520, y: 150, w: 204, h: 70 }, "Traefik", "wildcard TLS", "lock") +
        '<g class="dg-apps"><rect x="520" y="76" width="96" height="30" rx="8"/><rect x="626" y="76" width="98" height="30" rx="8"/><text x="568" y="96" text-anchor="middle">app</text><text x="675" y="96" text-anchor="middle">app</text></g>';
    },
    compact: function () {
      return card("me", { x: 44, y: 10, w: 286, h: 56 }, "My devices", "tailnet, the default", "laptop") +
        card("pub", { x: 44, y: 80, w: 286, h: 56 }, "Visitor", "Cloudflare Tunnel + login", "globe") +
        card("guest", { x: 44, y: 150, w: 286, h: 56 }, "Party guest", "Funnel, one evening", "users") +
        edge("w1", "M44 38 H18 V306 H70", "dg-e--t1") + edge("w2", "M44 108 H26 V321 H70", "dg-e--t2") + edge("w3", "M44 178 H34 V336 H70", "dg-e--t3") +
        group({ x: 50, y: 250, w: 280, h: 180 }, "the laptop", "dg-grp--host", "laptop") +
        card("traefik", { x: 70, y: 290, w: 240, h: 62 }, "Traefik", "wildcard TLS", "lock") +
        '<g class="dg-shield" data-n="shield"><circle cx="92" cy="392" r="18"/>' + glyph("shield", 82, 382) + '</g><text class="dg-m dg-m--ink" x="120" y="397">0 open ports</text>';
    },
    vb: ["0 0 760 366", "0 0 340 440"],
    seq: [
      ["lit", "shield"], ["lit", "me"], ["lit", "l1"], ["go", "w1", 1100], ["lit", "traefik"], ["wait", 300],
      ["lit", "pub"], ["lit", "l2"], ["go", "w2", 1000], ["wait", 300], ["lit", "guest"], ["lit", "l3"], ["go", "w3", 1100], ["wait", 2600]
    ]
  };

  /* 7. Homelab: inside the box */
  var MEM = [[10, "k3s"], [3, "Home Assistant"], [2, "host"], [1, "spare"]];
  function memBar(x, y, w, h, small) {
    var s = '<g class="dg-mem"><rect class="dg-mem__track" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10"/>', cx = x;
    MEM.forEach(function (m, i) {
      var sw = w * m[0] / 16;
      s += '<g class="dg-mem__seg dg-mem__seg--' + i + '" data-seg="' + i + '"><rect x="' + (cx + 2) + '" y="' + (y + 2) + '" width="' + (sw - 4) + '" height="' + (h - 4) + '" rx="8" style="transform-origin:' + (cx + 2) + 'px 0"/>' +
        '<text x="' + (cx + 12) + '" y="' + (y + h / 2 + 5) + '">' + (small && i > 1 ? "" : i > 1 ? "~" + m[0] : m[0] + " GB") + "</text></g>";
      cx += sw;
    });
    return s + "</g>";
  }
  D.box = {
    title: "Inside the box",
    alt: "Diagram: Proxmox on the laptop runs two virtual machines: Ubuntu with k3s, using 10 GB of the 16 GB memory, and Home Assistant OS with 3 GB, which gets the Zigbee USB stick passed straight through. The host uses about 2 GB and about 1 GB is spare. Snapshots are taken before every upgrade.",
    full: function () {
      return group({ x: 16, y: 16, w: 728, h: 340 }, "Proxmox, on the laptop under the TV", "dg-grp--host", "laptop") +
        card("vm1", { x: 40, y: 62, w: 300, h: 110 }, "VM 1: Ubuntu + k3s", "the apps, 15 of them", "box") + pods("vm1p", 88, 136, 6, 30) +
        card("vm2", { x: 360, y: 62, w: 220, h: 110 }, "VM 2: Home Assistant", "lights and sensors", "radio") +
        card("usb", { x: 600, y: 62, w: 124, h: 110 }, "Zigbee", "USB stick") +
        edge("z2ha", "M600 128 H580", "dg-e--t3") +
        '<g class="dg-waves"><path d="M676 156 a10 10 0 0 1 20 0"/><path d="M670 156 a16 16 0 0 1 32 0"/><path d="M664 156 a22 22 0 0 1 44 0"/></g>' +
        label(40, 208, "memory, 16 GB", "dg-m") + memBar(40, 218, 684, 48) +
        '<g class="dg-legend">' + MEM.map(function (m, i) { return '<g class="dg-key dg-key--' + i + '"><rect x="' + [40, 170, 390, 530][i] + '" y="280" width="10" height="10" rx="3"/><text class="dg-m" x="' + ([40, 170, 390, 530][i] + 18) + '" y="290">' + (i > 1 ? "~" : "") + m[0] + " GB " + m[1] + "</text></g>"; }).join("") + "</g>" +
        pill("snap", 40, 312, 270, "snapshot before every upgrade", "", "check") + label(724, 332, "USB passthrough, not in the cluster", "dg-m", "end");
    },
    compact: function () {
      return group({ x: 8, y: 8, w: 324, h: 470 }, "Proxmox, on the laptop", "dg-grp--host", "laptop") +
        card("vm1", { x: 24, y: 50, w: 292, h: 70 }, "VM 1: Ubuntu + k3s", "15 apps", "box") +
        card("vm2", { x: 24, y: 134, w: 292, h: 70 }, "VM 2: Home Assistant", "lights and sensors", "radio") +
        card("usb", { x: 24, y: 218, w: 292, h: 62 }, "Zigbee USB stick", "passed through", "usb") +
        edge("z2ha", "M170 218 V204", "dg-e--t3") +
        label(24, 312, "memory, 16 GB", "dg-m") + memBar(24, 322, 292, 48, true) +
        '<g class="dg-legend">' + MEM.map(function (m, i) { return '<text class="dg-m" x="' + (24 + (i % 2) * 150) + '" y="' + (398 + Math.floor(i / 2) * 22) + '">' + (i > 1 ? "~" : "") + m[0] + " GB " + m[1] + "</text>"; }).join("") + "</g>" +
        pill("snap", 24, 434, 292, "snapshot before every upgrade", "", "check");
    },
    vb: ["0 0 760 372", "0 0 340 486"],
    seq: [["mem", 0], ["lit", "vm1"], ["podsOn", "vm1p"], ["wait", 500], ["mem", 1], ["lit", "vm2"], ["wait", 400], ["lit", "usb"], ["go", "z2ha", 500], ["cls", "dg-radio", true], ["mem", 2], ["wait", 300], ["mem", 3], ["lit", "snap"], ["wait", 3200]]
  };

  /* 8. Platform: multi-region with CloudFront at the edge */
  D.edge = {
    title: "Europe and Tokyo, one edge",
    alt: "Diagram: users in Europe and in Asia and Oceania reach CloudFront at the edge, which serves cached content from the edge and uses cache behaviours to route requests by path to the regional origin: the European cluster or the cluster in Tokyo. A resource syncer we built keeps chosen Deployments, ConfigMaps and Secrets in Tokyo in step with the main cluster.",
    full: function () {
      return card("ueu", { x: 20, y: 40, w: 200, h: 68 }, "Users in Europe", "EU origin", "users") +
        card("uap", { x: 20, y: 262, w: 200, h: 68 }, "Users in Asia", "and Oceania", "users") +
        edge("e1", "M220 74 C 280 74, 270 170, 300 170") + edge("e2", "M220 296 C 280 296, 270 204, 300 204") +
        '<g class="dg-n dg-cdn" data-n="cdn"><rect class="dg-card" x="300" y="128" width="170" height="114" rx="16"/><rect class="dg-sheen" x="301" y="129" width="168" height="22" rx="15"/>' + glyph("cloud", 316, 144) +
        '<text class="dg-l" x="346" y="160">CloudFront</text><text class="dg-s" data-s x="316" y="190">edge cache</text><text class="dg-m" x="316" y="220">routes by path</text></g>' +
        edge("e3", "M470 160 C 520 160, 510 74, 540 74") + edge("e4", "M470 212 C 520 212, 510 296, 540 296") +
        card("eu", { x: 540, y: 34, w: 200, h: 80 }, "EU cluster", "main cluster", "stack") +
        card("jp", { x: 540, y: 256, w: 200, h: 80 }, "Tokyo cluster", "Asia Pacific", "stack") +
        edge("sync", "M700 114 V256", "dg-e--t3") + pill("syncp", 560, 168, 180, "resource syncer", "dg-pill--t3", "sync");
    },
    compact: function () {
      return card("ueu", { x: 10, y: 10, w: 154, h: 60 }, "Europe", "users", "users") +
        card("uap", { x: 176, y: 10, w: 154, h: 60 }, "Asia", "and Oceania", "users") +
        edge("e1", "M87 70 V110") + edge("e2", "M253 70 V110") +
        '<g class="dg-n dg-cdn" data-n="cdn"><rect class="dg-card" x="10" y="110" width="320" height="76" rx="14"/>' + glyph("cloud", 26, 126) +
        '<text class="dg-l" x="56" y="140">CloudFront</text><text class="dg-s" data-s x="56" y="164">edge cache, routes by path</text></g>' +
        edge("e3", "M87 186 V226") + edge("e4", "M253 186 V226") +
        card("eu", { x: 10, y: 226, w: 154, h: 70 }, "EU", "main cluster", "stack") +
        card("jp", { x: 176, y: 226, w: 154, h: 70 }, "Tokyo", "Asia Pacific", "stack") +
        edge("sync", "M164 276 H176", "dg-e--t3") + pill("syncp", 10, 312, 320, "resource syncer keeps Tokyo in step", "dg-pill--t3", "sync");
    },
    vb: ["0 0 760 370", "0 0 340 352"],
    seq: [
      ["lit", "ueu"], ["go", "e1", 700], ["lit", "cdn"], ["text", "cdn", "no cache hit: to origin"], ["go", "e3", 700], ["lit", "eu"], ["wait", 300],
      ["lit", "uap"], ["go", "e2", 700], ["text", "cdn", "to the Tokyo origin"], ["go", "e4", 700], ["lit", "jp"], ["wait", 300],
      ["lit", "syncp"], ["go", "sync", 900], ["text", "cdn", "edge cache"], ["wait", 2600]
    ]
  };

  /* ------------------------------------------------------------- render */
  function html(id, opts) {
    var d = D[id];
    opts = opts || {};
    return '<figure class="dg' + (opts.cls ? " " + opts.cls : "") + '" data-dg="' + id + '" role="img" aria-label="' + esc(d.alt) + '">' +
      svg("dg__svg--full", d.vb[0], d.title, d.full()) + svg("dg__svg--compact", d.vb[1], d.title, d.compact()) +
      (opts.caption === false ? "" : '<figcaption class="dg__cap"><span class="dg__title">' + esc(d.title) + '</span><button type="button" class="dg__replay" aria-label="Replay animation: ' + esc(d.title) + '">Replay</button></figcaption>') +
      "</figure>";
  }

  /* ------------------------------------------------------------- animation */
  var reduce = function () { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); };

  function Player(fig) {
    this.fig = fig; this.id = fig.getAttribute("data-dg"); this.run = 0; this.visible = false;
  }
  Player.prototype.svg = function () {
    var svgs = this.fig.querySelectorAll(".dg__svg");
    for (var i = 0; i < svgs.length; i++) if (svgs[i].getBoundingClientRect().width > 0) return svgs[i];
    return svgs[0];
  };
  Player.prototype.reset = function (s) {
    Array.prototype.forEach.call(s.querySelectorAll(".is-lit, .is-done, .is-on, .is-bad, .is-ok, .is-run, .is-new"), function (el) { el.classList.remove("is-lit", "is-done", "is-on", "is-bad", "is-ok", "is-run", "is-new"); });
    Array.prototype.forEach.call(s.querySelectorAll("[data-s]"), function (t) { if (t.__orig === undefined) t.__orig = t.textContent; t.textContent = t.__orig; });
    Array.prototype.forEach.call(s.querySelectorAll("[data-sts]"), function (t) { t.textContent = "waiting"; });
    var pr = s.querySelector("[data-pr]");
    if (pr) { pr.style.setProperty("--x", "0px"); pr.style.setProperty("--y", "0px"); pr.classList.remove("is-bad"); var a = pr.querySelector("[data-prs]"), b = pr.querySelector("[data-prm]"); if (a.__orig === undefined) { a.__orig = a.textContent; b.__orig = b.textContent; } a.textContent = a.__orig; b.textContent = b.__orig; }
    s.classList.remove("dg-live", "dg-radio");
    s.querySelectorAll(".dg-pk").forEach(function (p) { p.setAttribute("cx", -20); p.setAttribute("cy", -20); p.classList.remove("is-on"); });
  };
  function q(s, sel) { return s.querySelector(sel); }
  function node(s, id) { return q(s, '[data-n="' + id + '"]'); }

  Player.prototype.step = function (s, st, instant) {
    var self = this, run = this.run, k = st[0];
    var wait = function (ms) { return new Promise(function (r) { if (instant) return r(); setTimeout(r, ms); }); };
    if (k === "wait") return wait(st[1]);
    if (k === "lit") { var n = node(s, st[1]); if (n) n.classList.add("is-lit"); return wait(120); }
    if (k === "text" && st[3] && s.classList.contains("dg__svg--compact")) return wait(0);
    if (k === "text") { var n2 = node(s, st[1]); var t = n2 && n2.querySelector("[data-s]"); if (t) { if (t.__orig === undefined) t.__orig = t.textContent; t.textContent = st[2]; } return wait(160); }
    if (k === "cls") { s.classList.toggle(st[1], st[2]); return wait(100); }
    if (k === "podsOn") { var pg = q(s, '[data-pods="' + st[1] + '"]'); if (pg) pg.classList.add("is-on"); return wait(150); }
    if (k === "mem") { var sg = q(s, '[data-seg="' + st[1] + '"]'); if (sg) sg.classList.add("is-on"); return wait(500); }
    if (k === "roll") {
      var e = node(s, st[1]); if (!e) return wait(0);
      var ps = e.querySelectorAll(".dg-pod"), v = e.querySelector("[data-s]");
      if (v && v.__orig === undefined) v.__orig = v.textContent;
      if (instant) { Array.prototype.forEach.call(ps, function (p) { p.classList.add("is-on"); }); if (v) v.textContent = st[2]; return wait(0); }
      return new Promise(function (res) {
        var i = 0;
        (function next() {
          if (self.run !== run) return res();
          if (i >= ps.length) { if (v) { v.textContent = st[2]; v.classList.remove("is-new"); void v.getBBox(); v.classList.add("is-new"); } return res(); }
          ps[i].classList.add("is-run"); var p = ps[i];
          setTimeout(function () { p.classList.remove("is-run"); p.classList.add("is-on"); i++; next(); }, 260);
        })();
      });
    }
    if (k === "stage" || k === "reset-stages" || k === "pr" || k === "prbad" || k === "prtext" || k === "prm") {
      if (k === "reset-stages") { s.querySelectorAll(".dg-stage").forEach(function (g) { g.classList.remove("is-ok", "is-bad"); g.querySelector("[data-sts]").textContent = "waiting"; }); return wait(200); }
      var pr = q(s, "[data-pr]");
      if (k === "pr") {
        var full = s.classList.contains("dg__svg--full");
        if (full) {
          var off = Math.min(st[1] * 104, 470);
          pr.style.setProperty("--x", off + "px");
          pr.querySelector(".dg-pr__pin").setAttribute("d", "M" + (68 + st[1] * 104 - off) + " 158 V214");
        }
        if (st[2]) { pr.querySelector("[data-prs]").textContent = st[2]; pr.querySelector("[data-prm]").textContent = st[3]; }
        return wait(520);
      }
      if (k === "prbad") { pr.classList.toggle("is-bad", st[1]); pr.querySelector("[data-prm]").textContent = st[2]; return wait(200); }
      if (k === "prtext") { pr.querySelector("[data-prs]").textContent = st[1]; return wait(100); }
      if (k === "prm") { pr.querySelector("[data-prm]").textContent = st[1]; return wait(100); }
      var g2 = q(s, '[data-st="' + st[1] + '"]'); g2.classList.remove("is-ok", "is-bad"); g2.classList.add(st[2] === "ok" ? "is-ok" : "is-bad"); g2.querySelector("[data-sts]").textContent = st[3]; return wait(200);
    }
    if (k === "go") {
      var eg = q(s, '[data-e="' + st[1] + '"]'); if (!eg) return wait(0);
      var base = eg.querySelector(".dg-e__base");
      if (instant) { eg.classList.add("is-done"); return wait(0); }
      eg.classList.add("is-lit");
      var pk = s.querySelector(".dg-pk"), len = base.getTotalLength(), t0 = null, dur = st[2] || 800;
      pk.classList.add("is-on");
      return new Promise(function (res) {
        function frame(ts) {
          if (self.run !== run) return res();
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
          var pt = base.getPointAtLength(len * e);
          pk.setAttribute("cx", pt.x); pk.setAttribute("cy", pt.y);
          eg.style.setProperty("--p", e);
          if (p < 1) requestAnimationFrame(frame);
          else { eg.classList.remove("is-lit"); eg.classList.add("is-done"); pk.classList.remove("is-on"); res(); }
        }
        requestAnimationFrame(frame);
      });
    }
    return wait(0);
  };

  Player.prototype.play = function (once) {
    var self = this, d = D[this.id], s = this.svg(), run = ++this.run;
    this.reset(s); this.idle = false;
    if (reduce()) { d.seq.forEach(function (st) { self.step(s, st, true); }); s.classList.add("dg-still"); return; }
    var i = 0;
    (function next() {
      if (self.run !== run) return;
      if (i >= d.seq.length) {
        try { self.fig.dispatchEvent(new CustomEvent("dgdone", { bubbles: true })); } catch (e) {}
        if (once || !self.visible || self.fig.hasAttribute("data-noloop")) { self.idle = true; return; }
        setTimeout(function () { if (self.run === run && self.visible) self.play(); }, 400);
        return;
      }
      self.step(s, d.seq[i++], false).then(next);
    })();
  };
  Player.prototype.stop = function () { this.run++; };

  function mount(rootEl) {
    var figs = (rootEl || document).querySelectorAll(".dg:not([data-mounted])");
    var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var pl = en.target.__player;
        if (en.isIntersecting) { if (!pl.visible) { pl.visible = true; pl.play(); } }
        else if (pl.visible) { pl.visible = false; pl.stop(); }
      });
    }, { threshold: 0.35 }) : null;
    Array.prototype.forEach.call(figs, function (f) {
      f.setAttribute("data-mounted", "");
      var pl = new Player(f); f.__player = pl;
      var btn = f.querySelector(".dg__replay");
      if (btn) btn.addEventListener("click", function () { pl.visible = true; pl.play(); });
      f.addEventListener("mouseenter", function () { if (!reduce() && pl.idle) pl.play(); });
      if (io) io.observe(f); else { pl.visible = true; pl.play(); }
    });
    return io;
  }

  // Rough running time of one play, used for the tab progress bar.
  function est(id) {
    return D[id].seq.reduce(function (t, st) {
      var k = st[0];
      return t + (k === "wait" ? st[1] : k === "go" ? (st[2] || 800) : k === "roll" ? 1500 : k === "pr" ? 520 : k === "mem" ? 500 : 160);
    }, 0);
  }
  var api = { html: html, mount: mount, est: est, ids: Object.keys(D), D: D };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  root.BeeldDiagrams = api;
})(this);
