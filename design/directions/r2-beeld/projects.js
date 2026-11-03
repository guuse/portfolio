/*
 * r2-beeld · projects (round 6): three static project features, the "Also" list, the
 * case-study detail view (#<id>) with animated diagrams, and the screenshot lightbox.
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

  /* ------------------------------------------------------------- the projects */
  // Content: design/CONTENT-v6.md §6 and its addendum. Three static projects, in this order.
  var PROJECTS = [
    {
      id: "platform", no: "01", year: "2022–now", status: "Work",
      title: "A cloud-agnostic Kubernetes hosting platform",
      short: "Hosting platform",
      line: "The platform our client projects run on: eight clusters, one way of working.",
      story: "Every client used to get a slightly different setup. I designed one platform instead: the same building blocks on AWS or Azure, the same pipelines, the same monitoring. It now runs eight clusters, from small to large, in the Netherlands and abroad, including Japan. The biggest runs more than 1,500 pods. New apps get production and acceptance environments, TLS, logging and dashboards on day one, without anyone touching the cluster.",
      feature: { tabs: [["delivery", "delivery"], ["infra pipeline", "infra"], ["logging", "logs"], ["regions", "edge"]] },
      lead: { dg: "map" },
      numbers: [["8", "clusters"], ["1,500+", "pods on the largest"], ["~80", "Argo CD apps on the main cluster"], ["0", "static cloud keys in CI"]],
      sections: [
        { k: "foundation", title: "The foundation", lead: "Terraform modules for every building block, AWS first and Azure where the client lives.",
          bullets: [
            "<strong>EKS</strong> on a dual-stack (IPv4 and IPv6) network across three availability zones, with Aurora databases, Redis, OpenSearch, shared EFS storage and a bastion as ready-made modules.",
            "Nodes scale with load through <strong>Karpenter</strong>, so the cluster grows and shrinks on its own.",
            "Traffic: a Network Load Balancer with fixed IPs → ingress-nginx on every node (proxy protocol, HSTS) → the apps, with certificates by cert-manager.",
            "<strong>Rancher</strong> to manage the whole fleet of clusters from one place."
          ] },
        { k: "delivery", title: "App delivery: GitOps with Argo CD", dg: "delivery", lead: "Nobody edits the cluster by hand. A commit becomes a running release through git alone.",
          bullets: [
            "A root app-of-apps manages everything; Argo CD projects act as guardrails per team or client.",
            "Every app gets <strong>production</strong> and <strong>acceptance</strong>: production follows the newest stable release, acceptance the newest release candidate. Builds from main never deploy.",
            "CI builds immutable version tags; Argo CD Image Updater commits the new tag back to git, and Argo CD syncs.",
            "Onboarding a conventional repo is adding a GitHub topic: an ApplicationSet creates both environments."
          ] },
        { k: "infra", title: "Infrastructure delivery: Pulumi, policy first", dg: "infra", lead: "Infrastructure changes go through the same kind of pipeline as app code, with stricter gates.",
          bullets: [
            "Pulumi in Python, one independent state per concern, each with its own foundation.",
            "<strong>Policy first:</strong> a mandatory CrossGuard policy pack means a resource that breaks a rule can’t even be previewed, let alone applied.",
            "<strong>Tested:</strong> the logic lives in importable modules, and resource shapes are tested with Pulumi mocks.",
            "<strong>The pipeline is the only writer to production.</strong> Apply re-plans against fresh state and refuses anything destructive the reviewers didn’t approve (a fail-closed drift gate).",
            "<strong>No static keys:</strong> GitHub OIDC into short-lived cloud roles, on self-hosted runners in the cluster. The deploy role can never widen its own permissions.",
            "Reusable GitHub Actions for preview, deploy and drift, shared by every infrastructure repo. A daily drift check reports to Slack."
          ] },
        { k: "logs", title: "Logging pipeline", dg: "logs", lead: "Every log line from every pod, searchable in Grafana, stored encrypted.",
          bullets: [
            "Alloy runs on every node; Loki and its caches run on a dedicated platform node pool.",
            "Logs land in encrypted object storage. Retention (90 days) is owned by Loki’s compactor, never by bucket lifecycle rules, because those would corrupt queries.",
            "Exactly one service account can reach the bucket, through workload identity."
          ] },
        { k: "edge", title: "Multi-region: Europe and Tokyo", dg: "edge", lead: "One platform, closer to users in Asia and Oceania.",
          bullets: [
            "A second cluster in Asia Pacific (Tokyo) runs next to the European one.",
            "CloudFront routes by path and region and caches at the edge; dynamic requests go to the nearest cluster.",
            "A small resource syncer we built (a Kubernetes CronJob) keeps chosen Deployments, ConfigMaps and Secrets in Tokyo in step with the main cluster, so there’s still one place to make changes."
          ] },
        { k: "reliability", title: "Reliability", lead: "Planned, not urgent.",
          bullets: [
            "<strong>Disaster recovery with Velero</strong> on AWS and Azure: cluster resources and volume snapshots, backed up and restorable.",
            "A <strong>supported-services lifecycle</strong> with published end-of-support dates per version of databases, search and ingress, so upgrades are planned instead of urgent."
          ] },
        { k: "operate", title: "Operating it: a CLI that knows every environment", lead: "We built a small Python CLI so nobody needs a wiki page to get in.",
          bullets: [
            "SSO login with an admin or read-only role, per environment.",
            "A bastion shell without opening ports, policy-enforced previews, and bootstrapping a new environment’s foundation.",
            "It deliberately has no <code>apply</code>: only the pipeline changes production."
          ],
          cli: [["login", "SSO into an environment, admin or read-only"], ["shell", "a bastion session, no open ports"], ["preview", "a policy-enforced plan of a change"], ["bootstrap", "the foundation for a new environment"], ["apply", "not here: only the pipeline applies", true]] }
      ],
      timeline: [
        ["2022", "A first standardised hosting cluster on AWS EKS, built from Terraform modules and managed with Rancher."],
        ["then", "Multi-region (Europe + Tokyo) behind CloudFront; disaster recovery with Velero on AWS and Azure; Terraform state in one place."],
        ["then", "Deployments move to GitOps: GitHub Actions builds, Argo CD deploys, Image Updater promotes. Production and acceptance per app; onboarding by GitHub topic."],
        ["now", "Infrastructure moves to Pulumi in Python with push-based GitOps: policy first, tests, saved plans, review and drift gates, OIDC, self-hosted runners. Plus the logging pipeline and the CLI."]
      ],
      also: "Also running on the platform: metrics and dashboards (Grafana), network observability, an LLM gateway in front of a GPU machine, and MCP servers so AI agents can read the cluster safely.",
      chips: ["kubernetes", "argo-cd", "image-updater", "pulumi", "python", "crossguard", "terraform", "karpenter", "github-actions", "oidc", "loki", "alloy", "grafana", "velero", "rancher", "aws", "azure"],
      note: "Work project: no client names, no code, no screenshots."
    },
    {
      id: "homelab", no: "02", year: "2026", status: "Personal",
      title: "A fully automated Kubernetes platform, for one apartment",
      short: "Homelab & home automation",
      line: "Complete overkill for a home. Great fun to maintain.",
      story: "An old laptop under the TV, lid shut, runs the same kind of platform I build at work, just smaller. Proxmox hosts a k3s cluster and Home Assistant. Every app is built, tagged and rolled out from git without me touching anything. It has its own domain, real certificates, and no open ports. The battery doubles as a UPS.",
      feature: { tabs: [["git push \u2192 running", "push"], ["ways in", "ways"], ["inside the box", "box"]] },
      numbers: [["15", "Argo CD apps"], ["2", "virtual machines"], ["0", "open ports"], ["3", "ways in, all opt-in"]],
      sections: [
        { k: "push", title: "From git push to running", dg: "push", lead: "Push to main and walk away.",
          bullets: [
            "GitHub Actions builds every app into an image tagged with its commit SHA, on GHCR.",
            "Argo CD Image Updater sees the new tag and writes it to git; Argo CD syncs and the pods roll over.",
            "One repo holds an app-of-apps root that manages itself. Adding an app is adding one file."
          ] },
        { k: "ways", title: "Getting in", dg: "ways", lead: "Private by default, public only on purpose.",
          bullets: [
            "<strong>Tailnet</strong> (the default): my devices → Tailscale → Traefik → app. DNS for my own domain points at the tailnet, so names only resolve to something reachable on my devices.",
            "<strong>Cloudflare Tunnel + Access:</strong> a few apps are public on a friendly hostname, behind a login, without opening a port.",
            "<strong>Tailscale Funnel:</strong> a temporary public URL, for the quiz at a party.",
            "TLS everywhere: one wildcard Let’s Encrypt certificate via Cloudflare DNS-01, served by Traefik for every app."
          ] },
        { k: "box", title: "Inside the box", dg: "box", lead: "16 GB of memory, carefully split.",
          bullets: [
            "Proxmox runs VM 1 (Ubuntu + k3s, 10 GB) and VM 2 (Home Assistant OS, 3 GB). The host keeps about 2 GB, and about 1 GB is spare.",
            "Snapshots before every upgrade; everything else is rebuildable from git."
          ] },
        { k: "ha", title: "Home Assistant, the DevOps way", lead: "The lights get the same treatment as the apps.",
          bullets: [
            "In its own VM next to the cluster, not in it: USB passthrough of the Zigbee stick is one line.",
            "TLS through an NGINX proxy, a plain-HTTP fallback on the home network for when things break, and a monthly automation that renews its certificate.",
            "Moved from a Raspberry Pi with a full restore: the whole Zigbee mesh came across without re-pairing a single device.",
            "Dashboards and automations live in git. A tablet on the wall shows it all."
          ] }
      ],
      learned: [
        "Disk pressure at 30 GiB on a 500 GB SSD: the Ubuntu installer allocated only half the disk. One <code>lvextend</code>, zero downtime.",
        "Growing a disk on the host doesn’t tell the guest. Resize through Proxmox, not <code>lvextend</code>.",
        "MagicDNS without a global nameserver broke public DNS on every Linux node."
      ],
      snippet: true,
      chips: ["proxmox", "k3s", "argo-cd", "image-updater", "github-actions", "ghcr", "cert-manager", "traefik", "tailscale", "cloudflare", "home-assistant", "zigbee"],
      note: "The repository is private."
    },
    {
      id: "mtg", no: "03", year: "2026", status: "Personal",
      title: "MTG suite",
      short: "MTG suite",
      line: "Four tools for Magic: The Gathering: play, build, search and brew.",
      story: "Magic is my favourite hobby with friends, and it turned into a small suite of software. All four run on the homelab above.",
      feature: { shots: ["r99-home", "grimoire-library"] },
      lead: { shots: ["r99-home", "grimoire-library"] },
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
          shots: ["scryfall-result", "scryfall-mobile"], chips: ["claude-agent-sdk", "node", "sse"] },
        { title: "claude-mtg-skills", line: "Claude Code skills that build, upgrade, rate and explain real decks.",
          body: "Seven skills grounded in proven decklists and live prices, installable as a Claude Code plugin marketplace. MIT licensed, with at least 95% test coverage.",
          shots: ["mtg-skills-banner"], chips: ["claude-code", "skills"], link: ["github.com/guuse/claude-mtg-skills", "https://github.com/guuse/claude-mtg-skills"], public: true }
      ],
      chips: ["java", "react", "typescript", "node", "sqlite", "claude"],
      note: "One part is public; the links are below."
    }
  ];

  var ALSO = [
    { title: "Uren-assistent", lang: "nl", line: "A desktop app that turns a day’s activity into booked hours.", link: ["github", "https://github.com/guuse/uren-assistent"] },
    { title: "ux-testing skill", line: "A Claude Code skill that tests a web app’s flows in a real browser and fixes what breaks.", link: ["github", "https://github.com/guuse/claude-marketplace"] },
    { title: "Scouting agents", line: "Claude routines that watch Marktplaats, Vinted and Funda and email a digest.", priv: true }
  ];

  /* ---------------------------------------------------------------- helpers */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  var DG = function () { return root.BeeldDiagrams || (typeof require === "function" ? require("./diagrams.js") : null); };
  function dgHTML(id, opts) { var d = DG(); return d ? d.html(id, opts) : ""; }
  function vars(p) { return "--p: var(--tone-" + p.id + "); --p-ink: var(--pink-" + p.id + ")"; }
  function chipsHTML(list, label) {
    if (!list || !list.length) return "";
    return '<ul class="chips" aria-label="' + (label || "Built with") + '">' + list.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";
  }
  function statusHTML(p) {
    var k = p.status === "Work" ? "work" : p.status === "Live" ? "live" : "personal";
    return '<span class="state state--' + k + '"><span class="state__dot" aria-hidden="true"></span>' + esc(p.status) + "</span>";
  }
  function imgHTML(s, lazy) {
    return '<img src="' + s.src + '" width="' + s.w + '" height="' + s.h + '" alt="' + esc(s.alt) + '" ' + (lazy === false ? "" : 'loading="lazy" ') + 'decoding="async">';
  }
  function stackHTML(ids) {
    var a = shot(ids[0]), b = shot(ids[1]);
    return '<div class="shotstack"><div class="shotstack__back">' + imgHTML(a) + '</div><div class="shotstack__front">' + imgHTML(b) + "</div></div>";
  }
  function openAttrs(p) { return 'href="#' + p.id + '" data-open="' + p.id + '"'; }

  /* ---------------------------------------------------------- homepage feature */
  // Diagram tabs: auto-cycle through the project's diagrams (see behaviour below).
  function tabsHTML(p) {
    var t = p.feature.tabs;
    return '<div class="dgtabs" data-tabs>' +
      '<div class="dgtabs__list" role="tablist" aria-label="' + esc(p.short) + ' diagrams">' + t.map(function (tab, i) {
        return '<button type="button" role="tab" class="dgtabs__tab" id="tab-' + p.id + "-" + i + '" aria-controls="tp-' + p.id + "-" + i + '" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '"><span class="dgtabs__n">' + (i + 1) + "</span>" + esc(tab[0]) + '<span class="dgtabs__bar" aria-hidden="true"></span></button>';
      }).join("") + "</div>" +
      t.map(function (tab, i) {
        return '<div class="dgtabs__panel" role="tabpanel" id="tp-' + p.id + "-" + i + '" aria-labelledby="tab-' + p.id + "-" + i + '"' + (i ? " hidden" : "") + ">" + dgHTML(tab[1], { cls: "dg--feature" }) + "</div>";
      }).join("") + "</div>";
  }
  function featureHTML(p, i) {
    var media = p.feature.tabs ? tabsHTML(p) : stackHTML(p.feature.shots);
    return '<article class="pf pf--' + (i % 2 ? "left" : "right") + '" id="' + p.id + '-feature" data-project="' + p.id + '" style="' + vars(p) + '" aria-labelledby="pf-' + p.id + '">' +
      '<div class="pf__media">' + media + "</div>" +
      '<div class="pf__body">' +
        '<p class="pf__kicker"><span class="pf__no">' + p.no + '</span><span class="meta">' + esc(p.short.toLowerCase()) + "</span>" + statusHTML(p) + '<span class="meta">' + p.year + "</span></p>" +
        '<h3 class="pf__title display" id="pf-' + p.id + '"><a ' + openAttrs(p) + ">" + esc(p.title) + "</a></h3>" +
        '<p class="pf__line">' + esc(p.line) + "</p>" +
        '<p class="pf__story">' + esc(p.story) + "</p>" +
        (p.numbers ? '<dl class="pf__nums">' + p.numbers.slice(0, 3).map(function (n) { return "<div><dd>" + esc(n[0]) + "</dd><dt>" + esc(n[1]) + "</dt></div>"; }).join("") + "</dl>" : "") +
        (p.parts ? '<ul class="pf__parts">' + p.parts.map(function (pt) { return "<li>" + esc(pt.title) + "</li>"; }).join("") + "</ul>" : "") +
        '<p class="pf__cta"><a class="button button--ghost" ' + openAttrs(p) + '>Open the case study <span aria-hidden="true">→</span></a></p>' +
      "</div></article>";
  }
  function alsoHTML() {
    return ALSO.map(function (a) {
      return '<li class="also__row"><span class="also__title"' + (a.lang ? ' lang="' + a.lang + '"' : "") + ">" + esc(a.title) + '</span><span class="also__line">' + esc(a.line) + "</span>" +
        (a.priv ? '<span class="also__link meta">private</span>' : '<a class="also__link arrow-link" href="' + a.link[1] + '" target="_blank" rel="noopener">' + a.link[0] + ' <span aria-hidden="true">↗</span><span class="visually-hidden"> (' + esc(a.title) + ")</span></a>") + "</li>";
    }).join("");
  }

  /* ------------------------------------------------------------ case study */
  function galleryHTML(ids, group) {
    if (!ids || !ids.length) return "";
    return '<ul class="gallery" aria-label="Screenshots">' + ids.map(function (id, i) {
      var s = shot(id);
      return '<li class="gallery__item"><figure>' +
        '<button type="button" class="gallery__open" data-lightbox="' + group + '" data-index="' + i + '" aria-label="Enlarge: ' + esc(s.cap) + '">' +
        imgHTML(s) + '<span class="gallery__zoom" aria-hidden="true">⤢</span></button>' +
        "<figcaption>" + esc(s.cap) + "</figcaption></figure></li>";
    }).join("") + "</ul>";
  }
  function linkHTML(l) { return '<a class="arrow-link" href="' + l[1] + '" target="_blank" rel="noopener">' + esc(l[0]) + ' <span aria-hidden="true">↗</span></a>'; }

  function caseHTML(p) {
    var h = "";
    if (p.lead) h += '<div class="case__visual">' + (p.lead.dg ? dgHTML(p.lead.dg) : stackHTML(p.lead.shots)) + "</div>";
    h += '<div class="case__intro">' +
      '<div class="case__story"><p class="case__line">' + esc(p.line) + "</p><p>" + esc(p.story) + "</p></div>" +
      '<dl class="detail__facts">' +
        "<div><dt>type</dt><dd>" + statusHTML(p) + "</dd></div>" +
        "<div><dt>years</dt><dd>" + p.year + "</dd></div>" +
        (p.chips && p.chips.length ? "<div><dt>built with</dt><dd>" + chipsHTML(p.chips) + "</dd></div>" : "") +
        (p.note ? '<div><dt>code</dt><dd><span class="meta">' + esc(p.note) + "</span></dd></div>" : "") +
      "</dl></div>";
    if (p.numbers) h += '<dl class="stats tnum case__nums">' + p.numbers.map(function (n) { return "<div><dt>" + esc(n[1]) + "</dt><dd>" + esc(n[0]) + "</dd></div>"; }).join("") + "</dl>";
    if (p.sections) h += p.sections.map(function (sec, i) {
      return '<section class="cs' + (sec.dg ? " cs--dg" : "") + '" aria-labelledby="cs-' + p.id + "-" + sec.k + '">' +
        '<div class="cs__text"><p class="cs__k"><span>' + String.fromCharCode(97 + i) + "</span>" + esc(sec.k) + "</p>" +
        '<h3 class="cs__title" id="cs-' + p.id + "-" + sec.k + '">' + esc(sec.title) + "</h3>" +
        '<p class="cs__lead">' + esc(sec.lead) + "</p>" +
        '<ul class="cs__list">' + sec.bullets.map(function (b) { return "<li>" + b + "</li>"; }).join("") + "</ul></div>" +
        (sec.dg ? '<div class="cs__visual">' + dgHTML(sec.dg) + "</div>" : "") +
        (sec.cli ? '<figure class="snippet cs__cli"><figcaption><span class="meta"><b>platform CLI</b></span><span class="meta">commands, in plain words</span></figcaption><dl class="cli">' +
          sec.cli.map(function (c) { return '<div class="' + (c[2] ? "cli--no" : "") + '"><dt><code>' + c[0] + "</code></dt><dd>" + esc(c[1]) + "</dd></div>"; }).join("") + "</dl></figure>" : "") +
      "</section>";
    }).join("");
    if (p.timeline) h += '<section class="cs cs--timeline" aria-labelledby="cs-' + p.id + '-tl"><div class="cs__text"><p class="cs__k"><span>→</span>timeline</p><h3 class="cs__title" id="cs-' + p.id + '-tl">How it grew</h3></div>' +
      '<ol class="timeline">' + p.timeline.map(function (t, i) { return '<li class="timeline__item' + (i === p.timeline.length - 1 ? " timeline__item--now" : "") + '"><span class="timeline__when">' + esc(t[0]) + "</span><p>" + esc(t[1]) + "</p></li>"; }).join("") + "</ol></section>";
    if (p.also) h += '<p class="case__also">' + esc(p.also) + "</p>";
    if (p.learned) h += '<section class="cs" aria-labelledby="cs-' + p.id + '-lh"><div class="cs__text"><p class="cs__k"><span>!</span>gotchas</p><h3 class="cs__title" id="cs-' + p.id + '-lh">Learned the hard way</h3></div><ul class="gotchas">' + p.learned.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul></section>";
    if (p.snippet) h += '<section class="cs" aria-labelledby="cs-' + p.id + '-sn"><div class="cs__text"><p class="cs__k"><span>{}</span>config</p><h3 class="cs__title" id="cs-' + p.id + '-sn">One app, one file</h3><p class="cs__lead">Every app is one small file like this. Argo CD keeps the cluster in line with it.</p></div>' +
      '<figure class="snippet"><figcaption><span class="meta"><b>applications/rules-of-99.yaml</b></span><span class="meta">Argo CD</span></figcaption>' +
      '<pre tabindex="0" aria-label="Example Argo CD Application file"><code>' +
      '<span class="k">apiVersion:</span> <span class="v">argoproj.io/v1alpha1</span>\n<span class="k">kind:</span> <span class="v">Application</span>\n<span class="k">metadata:</span> { <span class="k">name:</span> <span class="v">rules-of-99</span> }\n<span class="k">spec:</span>\n  <span class="k">source:</span>\n    <span class="k">repoURL:</span> <span class="v">…/rules-of-99.git</span>\n    <span class="k">path:</span> <span class="v">deploy</span>\n  <span class="k">syncPolicy:</span>\n    <span class="c"># fix drift, remove what\'s gone</span>\n    <span class="k">automated:</span> { <span class="k">prune:</span> <span class="v">true</span>, <span class="k">selfHeal:</span> <span class="v">true</span> }' +
      "</code></pre></figure></section>";
    if (p.parts) h += '<div class="parts">' + p.parts.map(function (pt, i) {
      return '<section class="part">' +
        '<div class="part__head"><p class="meta">' + p.no + "." + (i + 1) + (pt.public ? " · public" : "") + "</p>" +
        '<h3 class="part__title">' + esc(pt.title) + "</h3>" +
        '<p class="part__line">' + esc(pt.line) + "</p></div>" +
        '<div class="part__body"><p>' + esc(pt.body) + "</p>" + chipsHTML(pt.chips) + (pt.link ? "<p>" + linkHTML(pt.link) + "</p>" : "") + "</div>" +
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
          '<button type="button" class="detail__btn" data-go="' + prev.id + '" aria-label="Previous project: ' + esc(prev.short) + '"><span aria-hidden="true">←</span><span class="detail__btn-text">' + esc(prev.short) + "</span></button>" +
          '<button type="button" class="detail__btn" data-go="' + next.id + '" aria-label="Next project: ' + esc(next.short) + '"><span class="detail__btn-text">' + esc(next.short) + '</span><span aria-hidden="true">→</span></button>' +
          '<button type="button" class="detail__btn detail__close" data-close aria-label="Close project"><span aria-hidden="true">✕</span><span class="detail__btn-text">Close</span></button>' +
        "</div>" +
      (p.sections ? '<nav class="toc" aria-label="Sections"><ol>' + p.sections.map(function (sec, k) { return '<li><a href="#cs-' + p.id + "-" + sec.k + '" data-toc="cs-' + p.id + "-" + sec.k + '"><span>' + String.fromCharCode(97 + k) + "</span>" + esc(sec.k) + "</a></li>"; }).join("") +
        (p.timeline ? '<li><a href="#cs-' + p.id + '-tl" data-toc="cs-' + p.id + '-tl"><span>\u2192</span>timeline</a></li>' : "") + "</ol></nav>" : "") +
      "</div>" +
      '<p class="meta detail__kicker">' + p.no + " · " + esc(p.short.toLowerCase()) + "</p>" +
      '<h2 class="detail__title display" id="detail-title" tabindex="-1">' + esc(p.title) + "</h2>" +
      '<div class="case">' + caseHTML(p) + "</div>" +
      '<nav class="detail__next" aria-label="More projects">' +
        '<button type="button" class="detail__card" data-go="' + prev.id + '" style="' + vars(prev) + '"><span class="meta">← previous</span><span class="detail__card-title">' + esc(prev.short) + "</span></button>" +
        '<button type="button" class="detail__card detail__card--next" data-go="' + next.id + '" style="' + vars(next) + '"><span class="meta">next →</span><span class="detail__card-title">' + esc(next.short) + "</span></button>" +
      "</nav>";
  }

  function render() { return { features: PROJECTS.map(featureHTML).join(""), also: alsoHTML() }; }
  function byId(id) { return PROJECTS.filter(function (p) { return p.id === id; })[0] || null; }
  function groupShots(group) {
    var parts = group.split("-"), p = byId(parts[0]);
    if (!p) return [];
    if (parts.length > 1 && p.parts) return p.parts[+parts[1]].shots || [];
    return p.shots || [];
  }

  var api = { PROJECTS: PROJECTS, ALSO: ALSO, SHOTS: SHOTS, render: render, detailHTML: detailHTML, caseHTML: caseHTML, featureHTML: featureHTML, byId: byId, shot: shot };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  root.BeeldProjects = api;

  /* ================================================================ behaviour */
  if (root.BeeldDiagrams) root.BeeldDiagrams.mount(document);

  var reduceM = function () { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); };

  /* Feature tabs: auto-advance when a diagram finishes (min 6 s), pause on hover/focus. */
  Array.prototype.forEach.call(document.querySelectorAll("[data-tabs]"), function (box) {
    var tabs = Array.prototype.slice.call(box.querySelectorAll('[role="tab"]'));
    var panels = Array.prototype.slice.call(box.querySelectorAll('[role="tabpanel"]'));
    var cur = 0, paused = false, inView = false, since = Date.now(), timer = null;
    var auto = !reduceM();
    panels.forEach(function (pn) { var f = pn.querySelector(".dg"); if (f && auto) f.setAttribute("data-noloop", ""); });
    function show(i, focus) {
      cur = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) { var on = k === cur; t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1; t.classList.remove("is-timing"); });
      panels.forEach(function (pn, k) { pn.hidden = k !== cur; });
      since = Date.now();
      if (auto && !paused) {
        var f = panels[cur].querySelector(".dg"), D = root.BeeldDiagrams;
        if (f && D) tabs[cur].style.setProperty("--dur", Math.max(6000, D.est(f.getAttribute("data-dg")) + 900) + "ms");
        void tabs[cur].offsetWidth; tabs[cur].classList.add("is-timing");
      }
      if (focus) tabs[cur].focus();
    }
    function next() { if (auto && !paused && inView) show(cur + 1); }
    tabs.forEach(function (t, k) {
      t.addEventListener("click", function () { show(k); });
      t.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (e.key === "Home") { e.preventDefault(); show(0, true); }
        else if (e.key === "End") { e.preventDefault(); show(tabs.length - 1, true); }
        else if (d) { e.preventDefault(); show(cur + d, true); }
      });
    });
    box.addEventListener("dgdone", function (e) {
      if (!panels[cur].contains(e.target)) return;
      var wait = Math.max(0, 6000 - (Date.now() - since));
      clearTimeout(timer); timer = setTimeout(function () {
        if (paused || !inView) { var f = panels[cur].querySelector(".dg"); if (f && f.__player && inView) f.__player.play(); return; }
        next();
      }, wait + 900);
    });
    var pause = function () { paused = true; box.classList.add("is-paused"); }, resume = function () { paused = false; box.classList.remove("is-paused"); var f = panels[cur].querySelector(".dg"); if (f && f.__player && f.__player.idle) next(); };
    box.addEventListener("mouseenter", pause); box.addEventListener("mouseleave", resume);
    box.addEventListener("focusin", pause); box.addEventListener("focusout", function (e) { if (!box.contains(e.relatedTarget)) resume(); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { inView = en[0].isIntersecting; }, { threshold: 0.3 }).observe(box);
    show(0);
  });

  /* Numbers count up once when they scroll into view. */
  function countUp(scope) {
    if (reduceM() || !("IntersectionObserver" in window)) return;
    var els = (scope || document).querySelectorAll(".numbers__list dd, .pf__nums dd, .case__nums dd");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var el = en.target, txt = el.getAttribute("data-final") || el.textContent;
        var m = txt.match(/^([^\d]*)([\d,]+)(.*)$/);
        if (!m) return;
        el.setAttribute("data-final", txt);
        var end = parseInt(m[2].replace(/,/g, ""), 10), comma = m[2].indexOf(",") > -1, t0 = null, dur = 1100;
        if (!end) return;
        (function f(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur), v = Math.round(end * (1 - Math.pow(1 - p, 3)));
          el.textContent = m[1] + (comma ? v.toLocaleString("en-US") : v) + m[3];
          if (p < 1) requestAnimationFrame(f); else el.textContent = txt;
        })(performance.now());
      });
    }, { threshold: 0.6 });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
  }
  countUp(document);
  root.BeeldCountUp = countUp;

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
    if (root.BeeldDiagrams) root.BeeldDiagrams.mount(panel);
    countUp(panel);
    var tocLinks = panel.querySelectorAll("[data-toc]");
    if (tocLinks.length) {
      var secs = Array.prototype.map.call(tocLinks, function (a) { return panel.querySelector("#" + a.getAttribute("data-toc")); });
      panel.onscroll = function () {
        var top = panel.getBoundingClientRect().top + 160, cur = -1;
        secs.forEach(function (sc, k) { if (sc && sc.getBoundingClientRect().top <= top) cur = k; });
        Array.prototype.forEach.call(tocLinks, function (a, k) { if (k === cur) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); });
      };
    } else panel.onscroll = null;
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
    var toc = t.closest("[data-toc]");
    if (toc) { e.preventDefault(); var target = document.getElementById(toc.getAttribute("data-toc")); if (target) { target.scrollIntoView({ behavior: reduceM() ? "auto" : "smooth", block: "start" }); target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true }); } return; }
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
