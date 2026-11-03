/*
 * r2-beeld · projects: data, illustrations, featured rotation, index highlight, detail view.
 * One project is featured per page load (random, or ?featured=<id>); the rest fill the
 * image grid in their normal order. The index lists all of them and highlights the matching
 * image on hover/focus (and the other way round). Every project opens an in-page detail
 * view at #<id> (Esc, the close button or browser back close it).
 * Without JS the server-rendered Homelab state stays.
 */
(function (root) {
  "use strict";

  var GITHUB = "https://github.com/guuse";

  var PROJECTS = [
    {
      id: "homelab", no: "01", year: "2026", status: "Live",
      title: "Homelab & home automation",
      line: "A small home server that runs my apps and my home automation.",
      story: "An old laptop under the TV runs everything: my side projects, Home Assistant and the lights. It’s only reachable through my own private network, and every change goes through git, so I can rebuild it in an afternoon. Next up: three small second-hand PCs to turn it into a proper cluster.",
      how: [
        "Proxmox runs two virtual machines: k3s for my apps, and Home Assistant with a Zigbee stick for the lights and sensors.",
        "Argo CD watches one git repo and keeps every app in line with it. New images roll out on their own.",
        "Nothing is open to the internet. I get in over Tailscale, and the apps still get proper HTTPS certificates."
      ],
      chips: ["proxmox", "k3s", "argo-cd", "home-assistant", "zigbee", "tailscale"],
      alt: "Illustration: a laptop running two virtual machines, k3s with six app chips and Home Assistant with a small Zigbee mesh, fed by git push and Argo CD, reached over a private network.",
      caseStudy: "project.html"
    },
    {
      id: "rules-of-99", no: "02", year: "2026", status: "In progress",
      title: "Rules of 99",
      line: "Play Commander (Magic: The Gathering) with friends in the browser.",
      story: "Import a deck, share a room code, and play with up to four people. An open-source rules engine handles the rules, so nobody has to argue about them. Works on phones too.",
      how: [
        "The open-source Forge engine runs the rules on the server: every card, commander tax, commander damage and colour identity.",
        "A WebSocket server sends each player only what they’re allowed to see, so the other hands never leave the server.",
        "Rooms survive a dropped connection, and on a phone the table turns into a one-board-at-a-time layout you can install."
      ],
      chips: ["java", "react", "typescript", "websockets", "sqlite"],
      alt: "Illustration: a four-seat game table seen from above, cards in play, life totals around the edge and the room code K7QX2P."
    },
    {
      id: "finds", no: "03", year: "2026", status: "Personal",
      title: "2nd-hand finds",
      line: "A tool that keeps an eye on Marktplaats and Vinted for me.",
      story: "Every two hours it checks for things I’m looking for, like Magic card collections or cheap mini PCs, and uses AI to filter out the noise. The good ones arrive in a short email.",
      how: [
        "Every two hours between 08:00 and 23:00 it searches Marktplaats and Vinted, skips what it has seen and applies hard filters.",
        "Claude judges what’s left against a short brief per search: Magic lots, mini PCs, and one pair of shoes.",
        "Good finds land in a short email digest. Once a day it checks for sold items and price drops."
      ],
      chips: ["python", "claude", "astro"],
      alt: "Illustration: an email digest with three finds, a Commander precon lot for 45 euros, a mini PC for 85 euros and shoes still being looked for, sent every two hours."
    },
    {
      id: "quizmaster", no: "04", year: "2026", status: "Live",
      title: "Quizmaster",
      line: "A live party quiz with questions generated on the spot.",
      story: "Everyone joins on their phone, picks a theme, and the questions are made up as you play. Built for one birthday, used at every party since.",
      how: [
        "Players join on their phone with a short code; one shared screen shows the question and the scores.",
        "Pick a theme and the questions are generated while you play, so no two rounds are the same."
      ],
      chips: [], /* [CONFIRM stack] */
      alt: "Illustration: a phone showing a quiz question with four answers, a timer ring at 12 seconds and eight players."
    },
    {
      id: "scryfall", no: "05", year: "2026", status: "Live",
      title: "Scryfall, in plain words",
      line: "Search Magic cards by describing what you want.",
      story: "Type “cheap green cards that ramp” and it turns that into a proper Scryfall search, checks that it returns results, and sends you there.",
      how: [
        "You describe the cards you want in plain words.",
        "Claude turns that into Scryfall’s search syntax and runs it once to check it returns cards.",
        "If it does, you land straight on the results."
      ],
      chips: ["claude", "typescript"], /* [CONFIRM stack] */
      alt: "Illustration: a search box reading cheap green ramp that isn't a land, an arrow to the query c:g otag:ramp -t:land usd<1, and 128 cards."
    }
  ];

  /* ------------------------------------------------------------ illustrations */
  // Drawn in a 480×360 box with CSS classes, so every option (and each project tone) recolours them.
  function T(x, y, s, cls, anchor) { return '<text x="' + x + '" y="' + y + '" class="' + (cls || "s-t") + '"' + (anchor ? ' text-anchor="' + anchor + '"' : "") + ">" + s + "</text>"; }
  function R(x, y, w, h, rx, cls, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" class="' + cls + '"' + (extra || "") + "/>"; }
  function chip(x, y, w, s) { return R(x, y, w, 22, 5, "s-chip") + T(x + 8, y + 15, s, "s-m s-ink"); }

  var ILLO = {
    homelab: function () {
      var apps = [["rules-of-99", 56, 152], ["finds", 160, 152], ["quizmaster", 56, 180], ["scryfall", 160, 180], ["dashboard", 56, 208], ["+2 more", 160, 208]];
      return '<path class="s-line" d="M128 37 H240 V100 H150 V116"/>' +
        '<path class="s-pulse" pathLength="600" d="M128 37 H240 V100 H150 V116"/>' +
        R(24, 22, 104, 30, 6, "s-box") + T(40, 42, "git push", "s-m s-ink") +
        R(188, 22, 104, 30, 6, "s-box s-box--tone") + T(206, 42, "argo cd", "s-m s-ink") +
        T(304, 42, "syncs every app", "s-m") +
        R(24, 84, 432, 208, 12, "s-host") + T(440, 287, "proxmox · the laptop under the TV", "s-m", "end") +
        R(40, 116, 220, 160, 8, "s-box") + T(56, 140, "k3s") + T(244, 140, "7 apps", "s-m", "end") +
        apps.map(function (a) { return chip(a[1], a[2], a[1] === 56 ? 96 : 84, a[0]); }).join("") +
        T(56, 258, "built and deployed from git", "s-s") +
        R(276, 116, 164, 160, 8, "s-box") + T(292, 140, "Home Assistant") +
        '<path class="s-line" d="M358 204 L306 190 M358 204 L414 188 M358 204 L312 248 M358 204 L408 246 M306 190 L312 248"/>' +
        '<circle cx="358" cy="204" r="10" class="s-tone"/>' +
        [[306, 190, "lamp"], [414, 188, "sensor"], [312, 248, "switch"], [408, 246, "plug"]].map(function (n) {
          return '<circle cx="' + n[0] + '" cy="' + n[1] + '" r="6" class="s-node"/>' + T(n[0], n[1] + (n[1] > 204 ? 20 : -11), n[2], "s-m", "middle");
        }).join("") +
        T(292, 158, "zigbee mesh", "s-m") +
        R(24, 312, 108, 30, 6, "s-box") + T(40, 332, "me, anywhere", "s-m s-ink") +
        '<path class="s-line s-dash" d="M132 327 H240 V292"/>' + T(150, 320, "tailscale", "s-m") +
        T(456, 332, "0 open ports", "s-m s-ink", "end");
    },
    "rules-of-99": function () {
      function card(x, y, r, tone) { return '<rect x="' + x + '" y="' + y + '" width="34" height="48" rx="4" class="' + (tone ? "s-tone" : "s-card") + '" transform="rotate(' + r + " " + (x + 17) + " " + (y + 24) + ')"/>'; }
      return R(16, 14, 124, 26, 13, "s-chip") + T(30, 31, "room K7QX2P", "s-m s-ink") +
        T(464, 31, "commander · 4 players", "s-m", "end") +
        R(66, 62, 348, 236, 30, "s-felt") +
        card(180, 92, -6, true) + card(222, 90, 2) + card(262, 92, 8) +
        card(196, 222, 4, true) + card(238, 224, -3) +
        card(106, 150, -84, true) + card(112, 196, -94) +
        card(338, 140, 86, true) + card(334, 186, 92) +
        '<circle cx="240" cy="180" r="24" class="s-ring"/>' + T(240, 185, "d20", "s-m s-ink", "middle") +
        R(186, 48, 108, 28, 14, "s-seat") + T(240, 67, "you · 40", "s-m s-ink", "middle") +
        R(186, 284, 108, 28, 14, "s-seat") + T(240, 303, "P3 · 33", "s-m s-ink", "middle") +
        R(28, 166, 84, 28, 14, "s-seat") + T(70, 185, "P2 · 38", "s-m s-ink", "middle") +
        R(368, 166, 84, 28, 14, "s-seat") + T(410, 185, "P4 · 40", "s-m s-ink", "middle") +
        T(240, 344, "rules enforced by the engine", "s-m", "middle");
    },
    finds: function () {
      var rows = [
        ["Commander precon lot", "€45 · 12 km · marktplaats", "keep", 0],
        ["Dell Micro i5-8500T 16 GB", "€85 · pickup · marktplaats", "keep", 1],
        ["New Balance Rover EU 40", "still looking · vinted", "watching", 2]
      ];
      return R(56, 24, 368, 312, 12, "s-paper") +
        T(78, 58, "2nd-hand finds", "s-t s-strong") + T(402, 58, "3 new", "s-m s-ink", "end") +
        '<line x1="78" y1="74" x2="402" y2="74" class="s-line"/>' +
        rows.map(function (r, i) {
          var y = 88 + i * 70;
          return R(78, y, 52, 52, 6, i === 0 ? "s-tone" : i === 1 ? "s-tone-2" : "s-tone-3") +
            T(144, y + 21, r[0]) + T(144, y + 41, r[1], "s-m") +
            R(r[2] === "keep" ? 354 : 334, y + 15, r[2] === "keep" ? 48 : 68, 22, 11, r[2] === "keep" ? "s-verdict" : "s-chip") +
            T(r[2] === "keep" ? 378 : 368, y + 30, r[2], "s-m s-ink", "middle") +
            (i < 2 ? '<line x1="78" y1="' + (y + 62) + '" x2="402" y2="' + (y + 62) + '" class="s-line s-faint"/>' : "");
        }).join("") +
        T(78, 316, "every 2 h, 08:00–23:00", "s-m") + T(402, 316, "judged by claude", "s-m", "end");
    },
    quizmaster: function () {
      var ans = ["Rotterdam", "Utrecht", "Antwerp", "Delft"];
      return R(30, 104, 112, 28, 14, "s-chip") + T(86, 123, "theme · Rotterdam", "s-m s-ink", "middle") +
        T(30, 168, "questions are", "s-m") + T(30, 184, "made up as you play", "s-m") +
        R(340, 104, 112, 86, 8, "s-box") + T(352, 124, "scores", "s-m") +
        T(352, 146, "P1", "s-m s-ink") + T(440, 146, "820", "s-m s-ink", "end") +
        T(352, 164, "P2", "s-m") + T(440, 164, "760", "s-m", "end") +
        T(352, 182, "P3", "s-m") + T(440, 182, "610", "s-m", "end") +
        R(164, 12, 152, 336, 24, "s-phone") + R(218, 22, 44, 6, 3, "s-chip") +
        T(182, 54, "Q 4/10", "s-m") + T(298, 54, "8 players", "s-m s-ink", "end") +
        '<circle cx="240" cy="96" r="24" class="s-ring"/>' +
        '<circle cx="240" cy="96" r="24" class="s-timer" pathLength="100" transform="rotate(-90 240 96)"/>' +
        T(240, 102, "12", "s-t s-strong", "middle") +
        T(240, 146, "Which city has the", "s-t", "middle") + T(240, 166, "Erasmus Bridge?", "s-t", "middle") +
        ans.map(function (a, i) {
          var y = 184 + i * 38;
          return R(180, y, 120, 30, 8, i === 0 ? "s-tone" : "s-box") + T(240, y + 20, a, i === 0 ? "s-t s-on-tone" : "s-t", "middle");
        }).join("");
    },
    scryfall: function () {
      var cards = [60, 122, 184, 246, 308, 370];
      return R(40, 40, 400, 52, 26, "s-box") +
        '<circle cx="70" cy="64" r="8" class="s-line"/><path class="s-line" d="M76 70 L82 76"/>' +
        T(94, 71, "cheap green ramp that isn’t a land") +
        '<path class="s-line" d="M240 100 V134 M233 127 L240 135 L247 127"/>' + T(252, 122, "claude writes the query", "s-m") +
        R(60, 142, 360, 42, 6, "s-chip") + T(240, 168, "c:g otag:ramp -t:land usd&lt;1", "s-m s-ink s-big", "middle") +
        T(60, 212, "checked: returns results", "s-m") + T(420, 212, "128 cards", "s-m s-ink", "end") +
        cards.map(function (x, i) { return R(x, 226, 50, 70, 4, i % 2 ? "s-card" : "s-tone"); }).join("") +
        T(240, 322, "→ straight to the results on Scryfall", "s-m", "middle");
    }
  };

  function illoSVG(p) {
    return '<svg class="il__svg" viewBox="0 0 480 360" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(p.alt) + '">' + ILLO[p.id]() + "</svg>";
  }

  // Grid slot ratios repeat every four; a lone trailing item spans wide.
  var SLOT = ["3:2", "4:5", "1:1", "4:3"];
  function slotRatio(i, n) {
    if (i === n - 1 && (i % 4 === 0 || i % 4 === 2)) return "21:9";
    return SLOT[i % 4];
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function vars(p) { return "--p: var(--tone-" + p.id + "); --p-ink: var(--pink-" + p.id + ")"; }
  function chipsHTML(p) {
    if (!p.chips.length) return "";
    return '<ul class="chips" aria-label="Built with">' + p.chips.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";
  }
  function statusHTML(p) {
    var k = p.status === "Live" ? "live" : p.status === "In progress" ? "wip" : "personal";
    return '<span class="state state--' + k + '"><span class="state__dot" aria-hidden="true"></span>' + esc(p.status) + "</span>";
  }
  function visualHTML(p) {
    return '<div class="ph il" style="--tone: var(--tone-' + p.id + ')">' + illoSVG(p) +
      '<span class="ph__label il__label" aria-hidden="true"><span class="ph__no">' + p.no + "</span>illustration</span></div>";
  }
  function metaHTML(p, ratio) {
    return '<p class="meta">fig.' + p.no + " — " + p.id + "/illustration.svg · " + ratio + "</p>";
  }
  function openAttrs(p) { return 'href="#' + p.id + '" data-open="' + p.id + '"'; }

  function featuredHTML(p) {
    return '<article class="page feature" id="p-' + p.id + '" data-project="' + p.id + '" style="' + vars(p) + '" aria-labelledby="feature-title">' +
      '<a class="feature__media" ' + openAttrs(p) + ' tabindex="-1" aria-hidden="true">' + visualHTML(p) + "</a>" +
      '<div class="feature__head">' +
        '<div class="feature__kicker"><p class="eyebrow"><span class="feature__dot" aria-hidden="true"></span><span data-copy="projects.featured">Featured</span></p>' + metaHTML(p, "16:9") + "</div>" +
        '<h3 class="feature__title display" id="feature-title"><a ' + openAttrs(p) + ">" + esc(p.title) + "</a></h3>" +
        '<p class="feature__line">' + esc(p.line) + "</p>" +
      "</div>" +
      '<div class="feature__story">' +
        '<p class="facts">' + statusHTML(p) + '<span class="meta">' + p.year + "</span></p>" +
        "<p>" + esc(p.story) + "</p>" +
        chipsHTML(p) +
        '<p><a class="arrow-link" ' + openAttrs(p) + ">How it works <span aria-hidden=\"true\">→</span></a></p>" +
      "</div>" +
    "</article>";
  }

  function itemHTML(p, i, n) {
    return '<li class="item" id="p-' + p.id + '" data-project="' + p.id + '" style="' + vars(p) + '">' +
      '<a class="item__media" ' + openAttrs(p) + ' tabindex="-1" aria-hidden="true">' + visualHTML(p) + "</a>" +
      '<div class="item__caption">' +
        metaHTML(p, slotRatio(i, n)) +
        '<h3 class="item__title"><a ' + openAttrs(p) + ">" + esc(p.title) + "</a></h3>" +
        '<p class="item__line">' + esc(p.line) + "</p>" +
        '<div class="item__facts">' + statusHTML(p) + chipsHTML(p) + "</div>" +
      "</div>" +
    "</li>";
  }

  function indexHTML(f) {
    return PROJECTS.map(function (p) {
      return '<li data-project="' + p.id + '" style="' + vars(p) + '"><a ' + openAttrs(p) + ">" +
        '<span class="index__no">' + p.no + "</span>" +
        '<span class="index__title">' + esc(p.title) + "</span>" +
        '<span class="index__mark">' + (p === f ? "↑ featured" : esc(p.status.toLowerCase())) + "</span></a></li>";
    }).join("");
  }

  function detailHTML(p) {
    var i = PROJECTS.indexOf(p), n = PROJECTS.length;
    var prev = PROJECTS[(i - 1 + n) % n], next = PROJECTS[(i + 1) % n];
    return '<div class="detail__bar">' +
        '<p class="meta">' + p.no + " / 0" + n + " · " + p.id + "</p>" +
        '<div class="detail__nav">' +
          '<button type="button" class="detail__btn" data-go="' + prev.id + '" aria-label="Previous project: ' + esc(prev.title) + '"><span aria-hidden="true">←</span> <span class="detail__btn-text">' + esc(prev.title) + "</span></button>" +
          '<button type="button" class="detail__btn" data-go="' + next.id + '" aria-label="Next project: ' + esc(next.title) + '"><span class="detail__btn-text">' + esc(next.title) + '</span> <span aria-hidden="true">→</span></button>' +
          '<button type="button" class="detail__btn detail__close" data-close aria-label="Close project (Esc)"><span aria-hidden="true">✕</span><span class="meta" aria-hidden="true">esc</span></button>' +
        "</div>" +
      "</div>" +
      '<div class="detail__visual">' + visualHTML(p) + "</div>" +
      '<div class="detail__body">' +
        '<div class="detail__head">' +
          '<h2 class="detail__title display" id="detail-title" tabindex="-1">' + esc(p.title) + "</h2>" +
          '<p class="detail__line">' + esc(p.line) + "</p>" +
        "</div>" +
        '<dl class="detail__facts">' +
          "<div><dt>status</dt><dd>" + statusHTML(p) + "</dd></div>" +
          "<div><dt>year</dt><dd>" + p.year + "</dd></div>" +
          (p.chips.length ? "<div><dt>built with</dt><dd>" + chipsHTML(p) + "</dd></div>" : "") +
        "</dl>" +
        '<div class="detail__story"><p>' + esc(p.story) + "</p></div>" +
        '<div class="detail__how"><h3 class="meta">how it works</h3><ol class="learned">' + p.how.map(function (h) { return "<li><p>" + esc(h) + "</p></li>"; }).join("") + "</ol></div>" +
        '<p class="detail__links">' +
          '<a class="arrow-link" href="' + GITHUB + '" target="_blank" rel="noopener">GitHub <span aria-hidden="true">↗</span></a>' +
          (p.caseStudy ? ' <a class="arrow-link" data-repo-only href="' + p.caseStudy + '">Full case study <span aria-hidden="true">→</span></a>' : "") +
        "</p>" +
      "</div>";
  }

  function render(featuredId) {
    var f = byId(featuredId) || PROJECTS[0];
    var rest = PROJECTS.filter(function (p) { return p !== f; });
    return {
      featured: featuredHTML(f),
      grid: rest.map(function (p, i) { return itemHTML(p, i, rest.length); }).join(""),
      index: indexHTML(f)
    };
  }
  function byId(id) { return PROJECTS.filter(function (p) { return p.id === id; })[0] || null; }

  function pickId() {
    var wanted = null;
    try { wanted = new URLSearchParams(location.search).get("featured"); } catch (e) {}
    if (wanted && byId(wanted)) return wanted;
    return PROJECTS[Math.floor(Math.random() * PROJECTS.length)].id;
  }

  var api = { PROJECTS: PROJECTS, render: render, detailHTML: detailHTML, visualHTML: visualHTML, byId: byId };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  root.BeeldProjects = api;

  var slot = document.getElementById("featured-slot");
  var grid = document.getElementById("project-grid");
  var index = document.getElementById("project-index");
  if (!slot || !grid) return;

  var id = pickId();
  if (slot.getAttribute("data-current") !== id) {
    var out = render(id);
    slot.innerHTML = out.featured;
    grid.innerHTML = out.grid;
    if (index) index.innerHTML = out.index;
    slot.setAttribute("data-current", id);
  }

  /* ---------------------------------------- two-way highlight: index lines and images */
  function hot(pid) {
    Array.prototype.forEach.call(document.querySelectorAll("#projects [data-project]"), function (el) {
      el.classList.toggle("is-hot", !!pid && el.getAttribute("data-project") === pid);
    });
    grid.classList.toggle("has-hot", !!pid && !!grid.querySelector('[data-project="' + pid + '"]'));
  }
  function from(e) {
    var el = e.target.closest && e.target.closest("[data-project]");
    return el ? el.getAttribute("data-project") : null;
  }
  [index, grid].forEach(function (zone) {
    if (!zone) return;
    zone.addEventListener("mouseover", function (e) { hot(from(e)); });
    zone.addEventListener("mouseleave", function () { hot(null); });
    zone.addEventListener("focusin", function (e) { hot(from(e)); });
    zone.addEventListener("focusout", function () { hot(null); });
  });

  /* ------------------------------------------------------------------ detail view */
  var dlg = document.getElementById("detail");
  var panel = dlg && dlg.querySelector(".detail__panel");
  var siteRoot = document.querySelector(".site");
  var lastTrigger = null, openId = null;
  if (!dlg || !panel) return;

  function setHash(h) {
    try { history.replaceState(null, "", h ? "#" + h : location.pathname + location.search); } catch (e) {}
  }
  function pushHash(h) {
    try { history.pushState({ detail: h }, "", "#" + h); return true; } catch (e) { return false; }
  }

  function open(pid, opts) {
    var p = byId(pid);
    if (!p) return;
    opts = opts || {};
    panel.innerHTML = detailHTML(p);
    panel.setAttribute("style", vars(p));
    if (window.BeeldDetailHook) window.BeeldDetailHook(panel);
    panel.scrollTop = 0;
    if (!openId) {
      dlg.hidden = false;
      // next frame: let the transition run
      requestAnimationFrame(function () { requestAnimationFrame(function () { dlg.classList.add("is-open"); }); });
      if (siteRoot) siteRoot.inert = true;
      document.documentElement.classList.add("has-detail");
    }
    openId = pid;
    var t = panel.querySelector("#detail-title");
    if (t) t.focus({ preventScroll: true });
  }

  function close(fromHistory) {
    if (!openId) return;
    openId = null;
    dlg.classList.remove("is-open");
    if (siteRoot) siteRoot.inert = false;
    document.documentElement.classList.remove("has-detail");
    var done = function () { if (!openId) { dlg.hidden = true; panel.innerHTML = ""; } };
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) done(); else setTimeout(done, 320);
    if (!fromHistory) setHash("");
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-open]");
    if (a) {
      e.preventDefault();
      lastTrigger = a.getAttribute("tabindex") === "-1" ? (a.closest("[data-project]").querySelector("a:not([tabindex])") || a) : a;
      var pid = a.getAttribute("data-open");
      pushHash(pid);
      open(pid);
      return;
    }
    if (!openId) return;
    var go = e.target.closest && e.target.closest("[data-go]");
    if (go) { var g = go.getAttribute("data-go"); setHash(g); open(g); var b = panel.querySelector('[data-go="' + g + '"]'); return; }
    if (e.target.closest && e.target.closest("[data-close]")) close();
  });

  document.addEventListener("keydown", function (e) {
    if (!openId) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "Tab") {
      // keep focus inside the panel
      var f = panel.querySelectorAll('a[href], button, [tabindex="0"]');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.querySelector("#detail-title"))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  function fromLocation() {
    var h = (location.hash || "").slice(1);
    if (byId(h)) open(h); else close(true);
  }
  window.addEventListener("popstate", fromLocation);
  window.addEventListener("hashchange", fromLocation);
  if (byId((location.hash || "").slice(1))) open(location.hash.slice(1));
})(this);
