/*
 * r2-beeld · projects (round 5): data from CONTENT-v5 §5, cards, featured rotation,
 * index ↔ image highlight, case-study detail view (#<id>) and the image lightbox.
 * One project is featured per page load (random, or ?featured=<id>); the other four fill
 * the grid in their normal order. Without JS the server-rendered Homelab state stays.
 */
(function (root) {
  "use strict";

  var GITHUB = "https://github.com/guuse";

  /* ------------------------------------------------------------------ images */
  // Real screenshots (assets/shots) with intrinsic sizes, so nothing shifts while loading.
  var SHOTS = {
    "r99-home": [1440, 900, "Rules of 99 home screen: the last deck played, its record and a Play button", "Home: pick up the last deck, or start a table with a room code."],
    "r99-table-setup": [1440, 900, "Rules of 99 table setup with four seats, each showing its commander", "Table setup: two to four seats, each with its commander."],
    "r99-workbench": [1440, 900, "Rules of 99 deck workbench with the card list by type, a mana curve and search", "The workbench: build and tune a deck with instant search over every card."],
    "r99-replay": [1440, 900, "Rules of 99 replay of a finished four-player game", "Replays: step back through a finished game."],
    "r99-card": [1440, 900, "Rules of 99 card details dialog open over a deck", "Card details, one click from anywhere."],
    "r99-home-mobile": [390, 844, "Rules of 99 home screen on a phone", "On a phone: the same app, one board at a time."],
    "grimoire-library": [1440, 1400, "Grimoire deck library with commander art for each deck", "The library: every deck at a glance."],
    "grimoire-builder": [1440, 1000, "Grimoire deck builder listing a deck's cards by category", "The builder: the list by category, legality and colour identity checked."],
    "grimoire-rating": [1440, 2000, "Grimoire deck analysis with mana curve, colour sources, categories and a bracket estimate", "Analysis: mana curve, colour sources, categories and a bracket estimate."],
    "grimoire-mobile": [390, 844, "Grimoire deck view on a phone", "On a phone."],
    "scryfall-result": [1140, 1250, "Scryfall in plain words: a plain-language request turned into a Scryfall query with 82 cards and a breakdown of each part", "Describe it, get a working query and what every part of it means."],
    "scryfall-mobile": [390, 844, "Scryfall in plain words on a phone", "On a phone."],
    "finds-overview": [1440, 900, "The 2nd-hand finds web app: a grid of kept Magic listings with price, distance and verdict", "The finds overview: listings worth a look, with price, distance and Claude's verdict."],
    "finds-mobile": [390, 844, "The 2nd-hand finds web app on a phone", "On a phone, for checking a find on the go."],
    "mtg-skills-banner": [1200, 450, "MTG Skills for Claude Code banner: brew, build, tune, untap the meta", "claude-mtg-skills: a Claude Code plugin marketplace."]
  };
  function shot(id) { var s = SHOTS[id]; return { id: id, src: "assets/shots/" + id + ".webp", w: s[0], h: s[1], alt: s[2], cap: s[3] }; }

  var PROJECTS = [
    {
      id: "homelab", no: "01", year: "2026", status: "Live",
      title: "Homelab platform",
      line: "A small, production-style Kubernetes platform on an old laptop under the TV.",
      story: "An old laptop with the lid shut runs Proxmox, a single-node k3s cluster and everything I build. It’s managed the way I’d run a client platform: one git repo, Argo CD syncing every app, wildcard TLS, and no open ports. If the disk dies, I rebuild it from the repo in an afternoon.",
      cover: { illo: "homelab" },
      numbers: [["16 GB", "memory"], ["2", "virtual machines"], ["15", "Argo CD applications"], ["0", "open ports"]],
      ram: [[10, "k3s"], [3, "Home Assistant"], [2, "host", "~"], [1, "spare", "~"]],
      how: [
        "Proxmox runs two VMs: Ubuntu with k3s for the apps, and Home Assistant OS (see the next project). The laptop battery doubles as a UPS.",
        "Argo CD watches one repo with an app-of-apps root that manages itself. Each app is one Application file; adding a repo is adding a file.",
        "GitHub Actions builds every app to an immutable commit-SHA image on GHCR. Argo CD Image Updater commits the new tag back to git, and Argo rolls it out.",
        "cert-manager gets one wildcard Let’s Encrypt certificate via Cloudflare DNS-01; Traefik serves it for every app, so no app needs its own certificate.",
        "Three ways in, all opt-in: the private tailnet by default, a Cloudflare Tunnel with Access for a few public hostnames, and Tailscale Funnel for a party-night URL."
      ],
      decisions: [
        ["k3s in a VM, not LXC", "Kubernetes in a container needs privileged mode and breaks on upgrades."],
        ["Home Assistant next to the cluster, not in it", "USB passthrough to a VM is one line."],
        ["Snapshots, no off-site backups", "Everything is rebuildable from git, by choice."]
      ],
      learned: [
        "Disk pressure at 30 GiB on a 500 GB SSD: the Ubuntu installer allocated only half the disk. One <code>lvextend</code>, zero downtime.",
        "Growing a disk on the host doesn’t tell the guest. Resize through Proxmox, not <code>lvextend</code>.",
        "MagicDNS without a global nameserver broke public DNS on every Linux node."
      ],
      snippet: true,
      chips: ["proxmox", "k3s", "argo-cd", "image-updater", "cert-manager", "traefik", "tailscale", "cloudflare"],
      privateRepo: true,
      alt: "Illustration: git push goes to Argo CD, which deploys into k3s with fifteen apps on a laptop that also runs Home Assistant, reachable only over a private network with zero open ports."
    },
    {
      id: "home", no: "02", year: "2026", status: "Live",
      title: "Home automation",
      line: "Home Assistant, a Zigbee mesh and a wall panel that knows when we’re home.",
      story: "Home Assistant runs in its own VM next to the cluster, with the Zigbee stick passed straight through. A tablet on the wall is the control panel; lift it off and it’s a normal tablet again, put it back and it returns to the dashboard. The automations and dashboards are versioned in git like everything else.",
      cover: { illo: "home" },
      how: [
        "Home Assistant OS in a VM, with a Zigbee coordinator over USB on an extension cable (USB3 noise and 2.4 GHz don’t mix).",
        "Moved from a Raspberry Pi to the VM with a full backup restore: the whole Zigbee mesh came across without re-pairing a single device.",
        "HTTPS through an NGINX proxy in front of Home Assistant, with a plain-HTTP fallback on the home network for when it’s having a bad day. A monthly automation renews the certificate.",
        "The wall panel is a Galaxy Tab in a kiosk browser. Charging state tells it it’s docked; NFC tags tell the wall dock from the desk dock."
      ],
      automations: [
        ["Someone is home", "Wall panel screen on"],
        ["Nobody home", "Wall panel screen off"],
        ["Tablet docked", "Dashboard to the foreground"],
        ["Wall-dock NFC tag", "Control dashboard"],
        ["Desk-dock NFC tag", "Ops dashboard"],
        ["Time of day", "Panel brightness"],
        ["Monthly", "Renew the certificate (restart the Let’s Encrypt and NGINX add-ons)"]
      ],
      photoSlot: "Photo of the wall panel: coming soon",
      chips: ["home-assistant", "zigbee", "zha", "fully-kiosk", "nfc"],
      privateRepo: true,
      alt: "Illustration: a wall-mounted tablet showing three rooms with their lights and who is home, next to a Zigbee mesh of lamps and sensors, and two automations: someone home turns the screen on, docking brings the dashboard forward."
    },
    {
      id: "mtg", no: "03", year: "2026", status: "Live",
      title: "MTG suite",
      line: "Four tools for Magic: The Gathering: play, build, search and brew.",
      story: "Magic is my favourite hobby with friends, and it turned into a small suite of software. All of it runs on the homelab.",
      cover: { shot: "r99-home", tall: "r99-home-mobile" },
      parts: [
        { title: "Rules of 99", line: "Commander in the browser, with full rules enforcement.",
          body: "An open-source rules engine (Forge) runs headless behind a WebSocket gateway; each player only receives what they’re allowed to see. Rooms with a 6-character code, 2–4 seats, reconnect-safe, replays, and a phone layout.",
          shots: ["r99-home", "r99-table-setup", "r99-workbench", "r99-replay", "r99-card", "r99-home-mobile"],
          chips: ["java", "react", "typescript", "websockets", "sqlite"] },
        { title: "Grimoire", line: "A deck library and builder, with an MCP server so Claude can search the whole card pool.",
          body: "Card data in SQLite with full-text search; exact colour-identity and legality filters; mana curve, colour sources, categories and a bracket estimate.",
          shots: ["grimoire-library", "grimoire-builder", "grimoire-rating", "grimoire-mobile"],
          chips: ["node", "sqlite", "fts5", "mcp"] },
        { title: "Scryfall, in plain words", line: "Describe the cards you want; get a working Scryfall query.",
          body: "The Claude Agent SDK writes a query, tests it against Scryfall, and offers stricter and broader readings, each with a breakdown of what every part means. The screenshots are the real UI with live Scryfall data.",
          shots: ["scryfall-result", "scryfall-mobile"],
          chips: ["claude-agent-sdk", "node", "sse"] },
        { title: "claude-mtg-skills", line: "Claude Code skills that build, upgrade, rate and explain real decks.",
          body: "Seven skills grounded in proven decklists and live prices, installable as a Claude Code plugin marketplace. MIT licensed, with at least 95% test coverage.",
          shots: ["mtg-skills-banner"], chips: ["claude-code", "skills"], link: ["github.com/guuse/claude-mtg-skills", "https://github.com/guuse/claude-mtg-skills"], public: true }
      ],
      chips: ["java", "react", "typescript", "node", "sqlite", "claude"]
    },
    {
      id: "ai", no: "04", year: "2026", status: "Live",
      title: "AI tooling",
      line: "Agents and apps that take the boring parts of the job off my hands.",
      story: "I use Claude every day, and when something is repetitive I’d rather build a tool than do it a fourth time. These are the ones I’ve published.",
      cover: { illo: "ai" },
      parts: [
        { title: "Uren-assistent", lang: "nl", line: "From a day’s activity to booked hours in one click.",
          body: "A Tauri 2 desktop app (React 19, TypeScript, Rust) that turns browser history, calendar and GitHub/Linear activity into time blocks, classifies them with an LLM, and books and submits them to Simplicate. At least 95% test coverage, MIT licensed.",
          chips: ["tauri", "rust", "react", "typescript"], link: ["github.com/guuse/uren-assistent", "https://github.com/guuse/uren-assistent"], public: true },
        { title: "ux-testing skill", line: "Autonomous, adversarial UX testing.",
          body: "It maps a web app’s user flows, drives a real browser with Playwright, tries to break each flow, files a fix task per bug, dispatches an agent to fix it, and re-runs until it passes. Part of my Claude marketplace.",
          chips: ["claude-code", "skills", "playwright"], link: ["github.com/guuse/claude-marketplace", "https://github.com/guuse/claude-marketplace"], public: true },
        { title: "claude-mtg-skills", line: "Seven Claude Code skills for Magic decks.", body: "Part of the MTG suite.", ref: "mtg",
          chips: [], link: ["github.com/guuse/claude-mtg-skills", "https://github.com/guuse/claude-mtg-skills"], public: true }
      ],
      chips: ["claude-code", "skills", "playwright", "tauri", "rust", "react"],
      alt: "Illustration: a day of work turned into time blocks and booked as 7.5 hours, and a Playwright checklist where a failing checkout flow gets a fix task and then passes."
    },
    {
      id: "scouts", no: "05", year: "2026", status: "Personal",
      title: "Scouting agents",
      line: "Two agents that watch Marktplaats, Vinted and Funda so I don’t have to.",
      story: "Both run as scheduled Claude routines on my laptop: search, filter, let Claude judge each listing against a short brief, and email a digest only when something’s worth it. One hunts second-hand finds, the other helped us search for a first home.",
      cover: { shot: "finds-overview", tall: "finds-mobile" },
      numbers: [["281", "finds recorded"], ["2 h", "between runs"], ["2", "platforms, plus Funda"]],
      how: [
        "Search the platforms every two hours (08:00–23:00), skip what was seen, apply hard filters.",
        "Claude judges each survivor against a short brief per category.",
        "A short email digest, price-drop alerts, and a small web app to keep or hide finds."
      ],
      shots: ["finds-overview", "finds-mobile"],
      shotsNote: "The house search stays private, so there are no screenshots of it.",
      chips: ["python", "claude", "astro", "resend"],
      privateRepo: true
    }
  ];

  /* ------------------------------------------------------------ illustrations */
  // Two drawings per illustration: a full one (480×360) and a compact one (320×300) with
  // fewer, larger labels for narrow containers. CSS picks one with a container query.
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function T(x, y, s, cls, anchor, lang) { return '<text x="' + x + '" y="' + y + '" class="' + (cls || "s-t") + '"' + (anchor ? ' text-anchor="' + anchor + '"' : "") + (lang ? ' lang="' + lang + '"' : "") + ">" + s + "</text>"; }
  function R(x, y, w, h, rx, cls) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" class="' + cls + '"/>'; }
  function chip(x, y, w, s) { return R(x, y, w, 24, 5, "s-chip") + T(x + 8, y + 16.5, s, "s-m s-ink"); }

  var ILLO = {
    homelab: {
      full: function () {
        var apps = [["rules-of-99", 56, 150, 104], ["grimoire", 168, 150, 80], ["scryfall", 56, 180, 104], ["finds", 168, 180, 80], ["dashboard", 56, 210, 104], ["+10 more", 168, 210, 80]];
        return '<path class="s-line" d="M128 37 H240 V100 H150 V116"/>' +
          '<path class="s-pulse" pathLength="600" d="M128 37 H240 V100 H150 V116"/>' +
          R(24, 20, 104, 34, 6, "s-box") + T(42, 42, "git push", "s-m s-ink") +
          R(188, 20, 104, 34, 6, "s-box s-box--tone") + T(208, 42, "argo cd", "s-m s-ink") +
          T(306, 42, "syncs every app", "s-m") +
          R(24, 84, 432, 212, 12, "s-host") + T(440, 289, "proxmox · the laptop under the TV", "s-m", "end") +
          R(40, 112, 220, 158, 8, "s-box") + T(56, 136, "k3s") + T(246, 136, "15 apps", "s-m", "end") +
          apps.map(function (a) { return chip(a[1], a[2], a[3], a[0]); }).join("") +
          R(276, 112, 164, 158, 8, "s-box") + T(292, 136, "Home Assistant") +
          T(292, 160, "its own VM", "s-m") + T(292, 180, "zigbee over USB", "s-m") +
          '<circle cx="358" cy="232" r="10" class="s-tone"/>' +
          [[316, 214], [400, 212], [320, 254], [398, 254]].map(function (n) { return '<path class="s-line" d="M358 232 L' + n[0] + " " + n[1] + '"/><circle cx="' + n[0] + '" cy="' + n[1] + '" r="5" class="s-node"/>'; }).join("") +
          R(24, 314, 124, 32, 6, "s-box") + T(40, 335, "me, anywhere", "s-m s-ink") +
          '<path class="s-line s-dash" d="M148 330 H240 V296"/>' + T(160, 322, "tailscale", "s-m") +
          T(456, 335, "0 open ports", "s-m s-ink", "end");
      },
      compact: function () {
        return '<path class="s-line" d="M146 36 H174"/><path class="s-line" d="M239 56 V98"/>' +
          '<path class="s-pulse" pathLength="600" d="M146 36 H239 V98"/>' +
          R(16, 16, 130, 40, 8, "s-box") + T(81, 42, "git push", "s-c s-ink", "middle") +
          R(174, 16, 130, 40, 8, "s-box s-box--tone") + T(239, 42, "argo cd", "s-c s-ink", "middle") +
          R(16, 84, 288, 128, 12, "s-host") +
          R(30, 98, 150, 100, 8, "s-box") + T(46, 128, "k3s", "s-t s-lg") + T(46, 154, "15 apps", "s-c") + T(46, 178, "from git", "s-c") +
          R(192, 98, 98, 100, 8, "s-box") + T(206, 128, "Home", "s-t s-lg") + T(206, 152, "Assistant", "s-t s-lg") +
          R(16, 242, 120, 42, 8, "s-box") + T(76, 268, "me", "s-c s-ink", "middle") +
          '<path class="s-line s-dash" d="M136 263 H160 V212"/>' +
          T(304, 268, "0 open ports", "s-c s-ink", "end");
      }
    },
    home: {
      full: function () {
        var rooms = [["Woonkamer", "on · 60%", 1], ["Keuken", "off", 0], ["Slaapkamer", "on · 20%", 1]];
        var nodes = [[354, 98, "lamp", -12], [458, 104, "sensor", -12], [352, 206, "door", 24], [460, 208, "plug", 24]];
        return T(24, 28, "wall panel · kiosk browser", "s-m") +
          R(20, 40, 312, 200, 16, "s-phone") + R(32, 52, 288, 176, 8, "s-box") +
          T(54, 82, "Home", "s-t s-strong") + R(234, 64, 74, 26, 13, "s-verdict") + T(271, 81.5, "2 home", "s-m s-on", "middle") +
          rooms.map(function (r, i) {
            var x = 44 + i * 90;
            return R(x, 100, 84, 112, 8, r[2] ? "s-tile s-tile--on" : "s-tile") +
              T(x + 42, 124, r[0], "s-s s-xs", "middle", "nl") +
              '<circle cx="' + (x + 22) + '" cy="160" r="11" class="' + (r[2] ? "s-tone" : "s-node") + '"/>' +
              T(x + 10, 198, r[1], "s-m");
          }).join("") +
          T(346, 58, "zigbee mesh", "s-m") +
          nodes.map(function (n) { return '<path class="s-line" d="M404 146 L' + n[0] + " " + n[1] + '"/>'; }).join("") +
          '<path class="s-line s-faint" d="M354 98 L458 104 M352 206 L460 208"/>' +
          '<circle cx="404" cy="146" r="13" class="s-tone"/>' + T(404, 176, "zha", "s-m s-ink", "middle") +
          nodes.map(function (n) { return '<circle cx="' + n[0] + '" cy="' + n[1] + '" r="7" class="s-node"/>' + T(n[0], n[1] + n[3], n[2], "s-m", "middle"); }).join("") +
          [["someone home", "screen on", 262], ["tablet docked", "dashboard to front", 304]].map(function (a) {
            return R(24, a[2], 186, 32, 16, "s-chip") + T(117, a[2] + 21, a[0], "s-m s-ink", "middle") +
              '<path class="s-line" d="M218 ' + (a[2] + 16) + " H250 M244 " + (a[2] + 10) + " L250 " + (a[2] + 16) + " L244 " + (a[2] + 22) + '"/>' +
              R(258, a[2], 198, 32, 16, "s-box s-box--tone") + T(357, a[2] + 21, a[1], "s-m s-ink", "middle");
          }).join("");
      },
      compact: function () {
        var rooms = [["Woonkamer", 1], ["Keuken", 0], ["Slaapkamer", 1]];
        return R(16, 12, 288, 178, 16, "s-phone") + R(28, 24, 264, 154, 8, "s-box") +
          T(42, 54, "Home", "s-t s-lg") + R(196, 34, 84, 28, 14, "s-verdict") + T(238, 53, "2 home", "s-c s-on", "middle") +
          rooms.map(function (r, i) {
            var x = 40 + i * 84;
            return R(x, 74, 76, 92, 8, r[1] ? "s-tile s-tile--on" : "s-tile") +
              '<circle cx="' + (x + 20) + '" cy="104" r="11" class="' + (r[1] ? "s-tone" : "s-node") + '"/>' +
              T(x + 38, 152, r[0], "s-s s-xs s-ink", "middle", "nl");
          }).join("") +
          R(16, 208, 288, 36, 18, "s-chip") + T(160, 231, "someone home → screen on", "s-c s-ink", "middle") +
          R(16, 254, 288, 36, 18, "s-box s-box--tone") + T(160, 277, "docked → dashboard", "s-c s-ink", "middle");
      }
    },
    ai: {
      full: function () {
        var blocks = [["standup", 24, 78, "s-tone-3"], ["PR review", 102, 108, "s-tone"], ["Linear issue", 210, 138, "s-tone-2"], ["call", 348, 54, "s-tone-3"], ["deploy", 402, 54, "s-tone"]];
        var hours = ["09", "10", "11", "12", "13", "14", "15", "16", "17"];
        return T(24, 30, "uren-assistent · one day", "s-m") +
          blocks.map(function (b) { return R(b[1] + 2, 44, b[2] - 4, 46, 6, b[3]) + T(b[1] + b[2] / 2, 72, b[0], "s-s s-ink", "middle"); }).join("") +
          '<line x1="24" y1="102" x2="456" y2="102" class="s-line"/>' +
          hours.map(function (h, i) { return T(24 + i * 54, 122, h, "s-m", i === 0 ? null : i === 8 ? "end" : "middle"); }).join("") +
          '<path class="s-line" d="M240 130 V148 M234 142 L240 148 L246 142"/>' +
          R(24, 156, 432, 40, 8, "s-box") + T(40, 181, "7.5 h booked", "s-t") + T(150, 181, "classified, then submitted", "s-m") +
          R(358, 164, 86, 24, 12, "s-verdict") + T(401, 180.5, "submitted", "s-m s-on", "middle") +
          T(24, 228, "ux-testing · playwright", "s-m") +
          [["sign-up flow", "passes", 0], ["checkout flow", "broke → fix task → passes", 1], ["settings flow", "passes", 0]].map(function (r, i) {
            var y = 240 + i * 38;
            return R(24, y, 432, 30, 6, r[2] ? "s-box s-box--tone" : "s-box") +
              '<circle cx="42" cy="' + (y + 15) + '" r="6" class="' + (r[2] ? "s-warn" : "s-tone") + '"/>' +
              T(58, y + 20, r[0], "s-s s-ink") + T(444, y + 20, r[1], "s-m", "end");
          }).join("");
      },
      compact: function () {
        return T(16, 26, "hours, booked", "s-c") +
          R(16, 38, 84, 48, 6, "s-tone-3") + R(106, 38, 112, 48, 6, "s-tone") + R(224, 38, 80, 48, 6, "s-tone-2") +
          T(24, 68, "standup", "s-c s-ink") + T(114, 68, "PR review", "s-c s-ink") + T(232, 68, "issue", "s-c s-ink") +
          R(16, 98, 288, 44, 8, "s-box") + T(30, 126, "7.5 h", "s-t s-lg") + R(194, 108, 98, 26, 13, "s-verdict") + T(243, 126, "submitted", "s-c s-on", "middle") +
          T(16, 176, "flows, tested", "s-c") +
          [["sign-up", "passes", 0], ["checkout", "fixed", 1], ["settings", "passes", 0]].map(function (r, i) {
            var y = 188 + i * 38;
            return R(16, y, 288, 32, 6, r[2] ? "s-box s-box--tone" : "s-box") +
              '<circle cx="34" cy="' + (y + 16) + '" r="6" class="' + (r[2] ? "s-warn" : "s-tone") + '"/>' +
              T(50, y + 21, r[0], "s-c s-ink") + T(292, y + 21, r[1], "s-c", "end");
          }).join("");
      }
    }
  };

  function illoHTML(p) {
    var il = ILLO[p.cover.illo];
    return '<div class="il__art" role="img" aria-label="' + esc(p.alt) + '">' +
      '<svg class="il__svg il__svg--full" viewBox="0 0 480 360" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + il.full() + "</svg>" +
      '<svg class="il__svg il__svg--compact" viewBox="0 0 320 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + il.compact() + "</svg></div>";
  }

  /* ---------------------------------------------------------------- templates */
  var SLOT = ["3:2", "4:5", "1:1", "4:3"];
  function slotRatio(i, n) {
    if (i === n - 1 && (i % 4 === 0 || i % 4 === 2)) return "21:9";
    return SLOT[i % 4];
  }
  function vars(p) { return "--p: var(--tone-" + p.id + "); --p-ink: var(--pink-" + p.id + ")"; }
  function chipsHTML(list, label) {
    if (!list || !list.length) return "";
    return '<ul class="chips" aria-label="' + (label || "Built with") + '">' + list.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";
  }
  function statusHTML(p) {
    var k = p.status === "Live" ? "live" : p.status === "In progress" ? "wip" : "personal";
    return '<span class="state state--' + k + '"><span class="state__dot" aria-hidden="true"></span>' + esc(p.status) + "</span>";
  }
  function imgHTML(s, eager) {
    return '<img src="' + s.src + '" width="' + s.w + '" height="' + s.h + '" alt="' + esc(s.alt) + '" ' + (eager ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async">';
  }
  // A card visual: a real screenshot on a tonal stage, or the illustration. `shape` picks the tall shot where one exists.
  function visualHTML(p, shape, eager) {
    if (p.cover.illo) {
      return '<div class="ph il" style="--tone: var(--tone-' + p.id + ')">' + illoHTML(p) +
        '<span class="ph__label il__label" aria-hidden="true"><span class="ph__no">' + p.no + "</span>illustration</span></div>";
    }
    var tall = shape === "tall" && p.cover.tall;
    var s = shot(tall ? p.cover.tall : p.cover.shot);
    return '<div class="ph stage' + (tall ? " stage--tall" : "") + '" style="--tone: var(--tone-' + p.id + ')">' + imgHTML(s, eager) +
      '<span class="ph__label il__label" aria-hidden="true"><span class="ph__no">' + p.no + "</span>screenshot</span></div>";
  }
  function coverFile(p, shape) {
    if (p.cover.illo) return p.id + "/illustration.svg";
    return (shape === "tall" && p.cover.tall ? p.cover.tall : p.cover.shot) + ".webp";
  }
  function metaHTML(p, ratio, shape) { return '<p class="meta">fig.' + p.no + " — " + coverFile(p, shape) + " · " + ratio + "</p>"; }
  function openAttrs(p) { return 'href="#' + p.id + '" data-open="' + p.id + '"'; }

  function featuredHTML(p) {
    return '<article class="page feature" id="p-' + p.id + '" data-project="' + p.id + '" style="' + vars(p) + '" aria-labelledby="feature-title">' +
      '<a class="feature__media" ' + openAttrs(p) + ' tabindex="-1" aria-hidden="true">' + visualHTML(p, "wide") + "</a>" +
      '<div class="feature__head">' +
        '<div class="feature__kicker"><p class="eyebrow"><span class="feature__dot" aria-hidden="true"></span>Featured</p>' + metaHTML(p, "16:9") + "</div>" +
        '<h3 class="feature__title display" id="feature-title"><a ' + openAttrs(p) + ">" + esc(p.title) + "</a></h3>" +
        '<p class="feature__line">' + esc(p.line) + "</p>" +
      "</div>" +
      '<div class="feature__story">' +
        '<p class="facts">' + statusHTML(p) + '<span class="meta">' + p.year + "</span>" + (p.parts ? '<span class="meta">' + p.parts.length + " parts</span>" : "") + "</p>" +
        "<p>" + esc(p.story) + "</p>" +
        chipsHTML(p.chips) +
        '<p><a class="button button--ghost" ' + openAttrs(p) + '>Open the case study <span aria-hidden="true">→</span></a></p>' +
      "</div>" +
    "</article>";
  }

  function itemHTML(p, i, n) {
    var ratio = slotRatio(i, n), shape = ratio === "4:5" ? "tall" : "wide";
    return '<li class="item" id="p-' + p.id + '" data-project="' + p.id + '" style="' + vars(p) + '">' +
      '<a class="item__media" ' + openAttrs(p) + ' tabindex="-1" aria-hidden="true">' + visualHTML(p, shape) + "</a>" +
      '<div class="item__caption">' +
        metaHTML(p, ratio, shape) +
        '<h3 class="item__title"><a ' + openAttrs(p) + ">" + esc(p.title) + "</a></h3>" +
        '<p class="item__line">' + esc(p.line) + "</p>" +
        '<div class="item__facts">' + statusHTML(p) + (p.parts ? '<span class="meta">' + p.parts.length + " parts</span>" : "") + "</div>" +
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

  /* ------------------------------------------------------------ case study */
  function galleryHTML(ids, group) {
    if (!ids || !ids.length) return "";
    return '<ul class="gallery" aria-label="Screenshots">' + ids.map(function (id, i) {
      var s = shot(id);
      return '<li class="gallery__item' + (s.w < s.h ? " gallery__item--tall" : "") + '"><figure>' +
        '<button type="button" class="gallery__open" data-lightbox="' + group + '" data-index="' + i + '" aria-label="Enlarge: ' + esc(s.cap) + '">' +
        imgHTML(s) + '<span class="gallery__zoom" aria-hidden="true">⤢</span></button>' +
        '<figcaption><span class="meta">' + id + ".webp</span> " + esc(s.cap) + "</figcaption></figure></li>";
    }).join("") + "</ul>";
  }
  function linkHTML(l) {
    return '<a class="arrow-link" href="' + l[1] + '" target="_blank" rel="noopener">' + esc(l[0]) + ' <span aria-hidden="true">↗</span></a>';
  }
  function section(title, body, cls) { return '<section class="case__sec' + (cls ? " " + cls : "") + '"><h3 class="case__h">' + title + "</h3>" + body + "</section>"; }

  function caseHTML(p) {
    var h = "";
    // lead visual: the illustration, or the first screenshot set as a gallery
    h += '<div class="case__visual">' + visualHTML(p, "wide") + "</div>";
    h += '<div class="case__intro">' +
      '<div class="case__story"><p class="case__line">' + esc(p.line) + "</p><p>" + esc(p.story) + "</p></div>" +
      '<dl class="detail__facts">' +
        "<div><dt>status</dt><dd>" + statusHTML(p) + "</dd></div>" +
        "<div><dt>year</dt><dd>" + p.year + "</dd></div>" +
        (p.chips && p.chips.length ? "<div><dt>built with</dt><dd>" + chipsHTML(p.chips) + "</dd></div>" : "") +
        "<div><dt>code</dt><dd>" + (p.privateRepo ? '<span class="meta">Repository is private</span>' : (p.parts ? '<span class="meta">Public parts are linked below</span>' : "")) + "</dd></div>" +
      "</dl></div>";

    if (p.numbers) h += section("in numbers", '<dl class="stats tnum">' + p.numbers.map(function (n) { return "<div><dt>" + esc(n[1]) + "</dt><dd>" + esc(n[0]) + "</dd></div>"; }).join("") + "</dl>");
    if (p.ram) {
      var total = p.ram.reduce(function (a, r) { return a + r[0]; }, 0);
      h += section("where the 16 GB goes",
        '<div class="ram" aria-hidden="true">' + p.ram.map(function (r, i) { return '<span class="ram__seg ram__seg--' + i + '" style="flex: ' + r[0] + '"><b>' + (r[2] || "") + r[0] + " GB</b> " + esc(r[1]) + "</span>"; }).join("") + "</div>" +
        '<ul class="visually-hidden">' + p.ram.map(function (r) { return "<li>" + (r[2] ? "about " : "") + r[0] + " GB of " + total + " for " + esc(r[1]) + "</li>"; }).join("") + "</ul>");
    }
    if (p.shots) h += section("screenshots", galleryHTML(p.shots, p.id) + (p.shotsNote ? '<p class="meta case__note">' + esc(p.shotsNote) + "</p>" : ""));
    if (p.how) h += section("how it works", '<ol class="learned">' + p.how.map(function (x) { return "<li><p>" + esc(x) + "</p></li>"; }).join("") + "</ol>");
    if (p.automations) h += section("automations that run every day",
      '<ul class="autos">' + p.automations.map(function (a) { return '<li><span class="autos__when"><span class="meta">when</span> ' + esc(a[0]) + '</span><span class="autos__arrow" aria-hidden="true">→</span><span class="autos__then"><span class="meta">then</span> ' + esc(a[1]) + "</span></li>"; }).join("") + "</ul>" +
      (p.photoSlot ? '<div class="ph case__photo" style="--tone: var(--tone-home); --ratio: 16 / 9" role="img" aria-label="' + esc(p.photoSlot) + '"><div class="ph__inner"></div><span class="ph__label" aria-hidden="true">' + esc(p.photoSlot) + "</span></div>" : ""));
    if (p.decisions) h += section("decisions", '<dl class="decisions">' + p.decisions.map(function (d) { return "<div><dt>" + esc(d[0]) + "</dt><dd>" + esc(d[1]) + "</dd></div>"; }).join("") + "</dl>");
    if (p.learned) h += section("learned the hard way", '<ul class="gotchas">' + p.learned.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>");
    if (p.snippet) h += section("one app, one file",
      '<p class="case__note-lead">Every app on the platform is one small file like this. Argo CD keeps the cluster in line with it.</p>' +
      '<figure class="snippet"><figcaption><span class="meta"><b>applications/rules-of-99.yaml</b></span><span class="meta">Argo CD</span></figcaption>' +
      '<pre tabindex="0" aria-label="Example Argo CD Application file"><code>' +
      '<span class="k">apiVersion:</span> <span class="v">argoproj.io/v1alpha1</span>\n<span class="k">kind:</span> <span class="v">Application</span>\n<span class="k">metadata:</span> { <span class="k">name:</span> <span class="v">rules-of-99</span> }\n<span class="k">spec:</span>\n  <span class="k">source:</span>\n    <span class="k">repoURL:</span> <span class="v">…/rules-of-99.git</span>\n    <span class="k">path:</span> <span class="v">deploy</span>\n  <span class="k">syncPolicy:</span>\n    <span class="c"># fix drift, remove what\'s gone</span>\n    <span class="k">automated:</span> { <span class="k">prune:</span> <span class="v">true</span>, <span class="k">selfHeal:</span> <span class="v">true</span> }' +
      "</code></pre></figure>");
    if (p.parts) h += '<div class="parts">' + p.parts.map(function (pt, i) {
      return '<section class="part">' +
        '<div class="part__head"><p class="meta">' + p.no + "." + (i + 1) + (pt.public ? " · public" : "") + "</p>" +
        '<h3 class="part__title"' + (pt.lang ? ' lang="' + pt.lang + '"' : "") + ">" + esc(pt.title) + "</h3>" +
        '<p class="part__line">' + esc(pt.line) + "</p></div>" +
        '<div class="part__body"><p>' + esc(pt.body) + (pt.ref ? ' <a href="#' + pt.ref + '" data-go="' + pt.ref + '">Open the MTG suite</a>.' : "") + "</p>" +
        chipsHTML(pt.chips) + (pt.link ? "<p>" + linkHTML(pt.link) + "</p>" : "") + "</div>" +
        galleryHTML(pt.shots, p.id + "-" + i) +
      "</section>";
    }).join("") + "</div>";
    return h;
  }

  function detailHTML(p) {
    var i = PROJECTS.indexOf(p), n = PROJECTS.length;
    var prev = PROJECTS[(i - 1 + n) % n], next = PROJECTS[(i + 1) % n];
    return '<div class="detail__bar">' +
        '<p class="meta">project ' + p.no + " of 0" + n + "</p>" +
        '<div class="detail__nav">' +
          '<button type="button" class="detail__btn" data-go="' + prev.id + '" aria-label="Previous project: ' + esc(prev.title) + '"><span aria-hidden="true">←</span><span class="detail__btn-text">' + esc(prev.title) + "</span></button>" +
          '<button type="button" class="detail__btn" data-go="' + next.id + '" aria-label="Next project: ' + esc(next.title) + '"><span class="detail__btn-text">' + esc(next.title) + '</span><span aria-hidden="true">→</span></button>' +
          '<button type="button" class="detail__btn detail__close" data-close aria-label="Close project"><span aria-hidden="true">✕</span><span class="detail__btn-text">Close</span></button>' +
        "</div>" +
      "</div>" +
      '<h2 class="detail__title display" id="detail-title" tabindex="-1">' + esc(p.title) + "</h2>" +
      '<div class="case">' + caseHTML(p) + "</div>" +
      '<nav class="detail__next" aria-label="More projects">' +
        '<button type="button" class="detail__card" data-go="' + prev.id + '" style="' + vars(prev) + '"><span class="meta">← previous</span><span class="detail__card-title">' + esc(prev.title) + "</span></button>" +
        '<button type="button" class="detail__card detail__card--next" data-go="' + next.id + '" style="' + vars(next) + '"><span class="meta">next →</span><span class="detail__card-title">' + esc(next.title) + "</span></button>" +
      "</nav>";
  }

  function render(featuredId) {
    var f = byId(featuredId) || PROJECTS[0];
    var rest = PROJECTS.filter(function (p) { return p !== f; });
    return { featured: featuredHTML(f), grid: rest.map(function (p, i) { return itemHTML(p, i, rest.length); }).join(""), index: indexHTML(f) };
  }
  function byId(id) { return PROJECTS.filter(function (p) { return p.id === id; })[0] || null; }
  function groupShots(group) {
    var parts = group.split("-"), p = byId(parts[0]);
    if (!p) return [];
    if (parts.length > 1 && p.parts) return p.parts[+parts[1]].shots || [];
    return p.shots || [];
  }

  var api = { PROJECTS: PROJECTS, SHOTS: SHOTS, render: render, detailHTML: detailHTML, caseHTML: caseHTML, visualHTML: visualHTML, byId: byId, shot: shot };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  root.BeeldProjects = api;

  /* ================================================================ behaviour */
  var slot = document.getElementById("featured-slot");
  var grid = document.getElementById("project-grid");
  var index = document.getElementById("project-index");

  function pickId() {
    var wanted = null;
    try { wanted = new URLSearchParams(location.search).get("featured"); } catch (e) {}
    if (wanted && byId(wanted)) return wanted;
    return PROJECTS[Math.floor(Math.random() * PROJECTS.length)].id;
  }
  if (slot && grid) {
    var id = pickId();
    if (slot.getAttribute("data-current") !== id) {
      var out = render(id);
      slot.innerHTML = out.featured; grid.innerHTML = out.grid;
      if (index) index.innerHTML = out.index;
      slot.setAttribute("data-current", id);
    }
    // two-way highlight: index lines and images
    var hot = function (pid) {
      Array.prototype.forEach.call(document.querySelectorAll("#projects [data-project]"), function (el) {
        el.classList.toggle("is-hot", !!pid && el.getAttribute("data-project") === pid);
      });
      grid.classList.toggle("has-hot", !!pid && !!grid.querySelector('[data-project="' + pid + '"]'));
    };
    var from = function (e) { var el = e.target.closest && e.target.closest("[data-project]"); return el ? el.getAttribute("data-project") : null; };
    [index, grid].forEach(function (zone) {
      if (!zone) return;
      zone.addEventListener("mouseover", function (e) { hot(from(e)); });
      zone.addEventListener("mouseleave", function () { hot(null); });
      zone.addEventListener("focusin", function (e) { hot(from(e)); });
      zone.addEventListener("focusout", function () { hot(null); });
    });
  }

  /* ------------------------------------------------------------- detail view */
  var dlg = document.getElementById("detail");
  var panel = dlg && dlg.querySelector(".detail__panel");
  var lb = document.getElementById("lightbox");
  var siteRoot = document.querySelector(".site");
  var lastTrigger = null, openId = null;
  var reduce = function () { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; };
  function setHash(h) { try { history.replaceState(null, "", h ? "#" + h : location.pathname + location.search); } catch (e) {} }
  function pushHash(h) { try { history.pushState({ detail: h }, "", "#" + h); } catch (e) {} }

  function trapTab(e, box, firstFallback) {
    var f = Array.prototype.filter.call(box.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]'), function (el) { return el.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === firstFallback)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function open(pid) {
    var p = byId(pid);
    if (!p || !dlg) return;
    panel.innerHTML = detailHTML(p);
    panel.setAttribute("style", vars(p));
    panel.scrollTop = 0;
    if (!openId) {
      dlg.hidden = false;
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
    closeLightbox(true);
    openId = null;
    dlg.classList.remove("is-open");
    if (siteRoot) siteRoot.inert = false;
    document.documentElement.classList.remove("has-detail");
    var done = function () { if (!openId) { dlg.hidden = true; panel.innerHTML = ""; } };
    if (reduce()) done(); else setTimeout(done, 320);
    if (!fromHistory) setHash("");
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
  }

  /* ------------------------------------------------------------------ lightbox */
  var lbItems = [], lbIndex = 0, lbTrigger = null;
  function lbRender() {
    var s = shot(lbItems[lbIndex]);
    var img = lb.querySelector(".lightbox__img");
    img.src = s.src; img.width = s.w; img.height = s.h; img.alt = s.alt;
    lb.querySelector(".lightbox__cap").textContent = s.cap;
    lb.querySelector(".lightbox__count").textContent = (lbIndex + 1) + " / " + lbItems.length;
    var many = lbItems.length > 1;
    lb.querySelector("[data-lb-prev]").hidden = !many;
    lb.querySelector("[data-lb-next]").hidden = !many;
  }
  function openLightbox(group, i, trigger) {
    if (!lb) return;
    lbItems = groupShots(group); lbIndex = i; lbTrigger = trigger;
    if (!lbItems.length) return;
    lbRender();
    lb.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () { lb.classList.add("is-open"); }); });
    if (panel) panel.inert = true;
    lb.querySelector("[data-lb-close]").focus({ preventScroll: true });
  }
  function closeLightbox(silent) {
    if (!lb || lb.hidden) return;
    lb.classList.remove("is-open");
    lb.hidden = true;
    if (panel) panel.inert = false;
    if (!silent && lbTrigger && document.contains(lbTrigger)) lbTrigger.focus({ preventScroll: true });
  }
  function lbStep(d) { if (lbItems.length < 2) return; lbIndex = (lbIndex + d + lbItems.length) % lbItems.length; lbRender(); }

  if (lb) {
    lb.addEventListener("click", function (e) {
      if (e.target.closest("[data-lb-prev]")) return lbStep(-1);
      if (e.target.closest("[data-lb-next]")) return lbStep(1);
      if (e.target.closest("[data-lb-close]") || e.target === lb || e.target.classList.contains("lightbox__stage")) closeLightbox();
    });
    // swipe
    var sx = null;
    lb.addEventListener("pointerdown", function (e) { if (e.pointerType !== "mouse") sx = e.clientX; });
    lb.addEventListener("pointerup", function (e) { if (sx === null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) lbStep(dx < 0 ? 1 : -1); });
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target : null;
    if (!t) return;
    var lbBtn = t.closest("[data-lightbox]");
    if (lbBtn) { e.preventDefault(); openLightbox(lbBtn.getAttribute("data-lightbox"), +lbBtn.getAttribute("data-index"), lbBtn); return; }
    var a = t.closest("[data-open]");
    if (a && dlg) {
      e.preventDefault();
      lastTrigger = a.getAttribute("tabindex") === "-1" ? (a.closest("[data-project]").querySelector("a:not([tabindex])") || a) : a;
      var pid = a.getAttribute("data-open");
      if (openId) setHash(pid); else pushHash(pid);
      open(pid);
      return;
    }
    if (!openId) return;
    var go = t.closest("[data-go]");
    if (go) { e.preventDefault(); var g = go.getAttribute("data-go"); setHash(g); open(g); return; }
    if (t.closest("[data-close]")) close();
  });

  document.addEventListener("keydown", function (e) {
    if (lb && !lb.hidden) {
      if (e.key === "Escape") { e.preventDefault(); closeLightbox(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); lbStep(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); lbStep(1); }
      else if (e.key === "Tab") trapTab(e, lb);
      return;
    }
    if (!openId) return;
    if (e.key === "Escape") { e.preventDefault(); close(); return; }
    if (e.key === "Tab") trapTab(e, panel, panel.querySelector("#detail-title"));
  });

  function fromLocation() {
    var h = (location.hash || "").slice(1);
    if (byId(h)) open(h); else close(true);
  }
  window.addEventListener("popstate", fromLocation);
  window.addEventListener("hashchange", fromLocation);
  if (dlg && byId((location.hash || "").slice(1))) open(location.hash.slice(1));
})(this);
