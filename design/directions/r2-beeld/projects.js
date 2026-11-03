/*
 * Project data + featured rotation for r2-beeld.
 * One project is featured per page load (random, or ?featured=<id>); the rest fill the
 * image grid in their normal order. Without JS the server-rendered Homelab state stays.
 */
(function (root) {
  "use strict";

  var PROJECTS = [
    {
      id: "homelab",
      title: "Homelab & home automation",
      line: "A small home server that runs my apps and my home automation.",
      story: "An old laptop under the TV runs everything: my side projects, Home Assistant and the lights. It’s only reachable through my own private network, and every change goes through git, so I can rebuild it in an afternoon. Next up: three small second-hand PCs to turn it into a proper cluster.",
      tags: ["Proxmox", "Kubernetes", "Home Assistant", "Zigbee"],
      photo: "Photo: the setup under the TV",
      href: "project.html"
    },
    {
      id: "rules-of-99",
      title: "Rules of 99",
      line: "Play Commander (Magic: The Gathering) with friends in the browser.",
      story: "Import a deck, share a room code, and play with up to four people. An open-source rules engine handles the rules, so nobody has to argue about them. Works on phones too.",
      tags: ["Java", "React", "TypeScript", "WebSockets"],
      photo: "Screenshot: a 4-player game",
      href: "project.html"
    },
    {
      id: "finds",
      title: "2nd-hand finds",
      line: "A tool that keeps an eye on Marktplaats and Vinted for me.",
      story: "Every two hours it checks for things I’m looking for, like Magic card collections or cheap mini PCs, and uses AI to filter out the noise. The good ones arrive in a short email.",
      tags: ["Python", "Claude", "Astro"],
      photo: "Screenshot: the finds overview",
      href: "project.html"
    },
    {
      id: "quizmaster",
      title: "Quizmaster",
      line: "A live party quiz with questions generated on the spot.",
      story: "Everyone joins on their phone, picks a theme, and the questions are made up as you play. Built for one birthday, used at every party since.",
      tags: [], /* [CONFIRM stack] */
      photo: "Screenshot: the quiz on a phone",
      href: "project.html"
    },
    {
      id: "scryfall",
      title: "Scryfall, in plain words",
      line: "Search Magic cards by describing what you want.",
      story: "Type “cheap green cards that ramp” and it turns that into a proper Scryfall search, checks that it returns results, and sends you there.",
      tags: ["Claude", "TypeScript"],
      photo: "Screenshot: search box + results",
      href: "project.html"
    }
  ];

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function tagsHTML(p) {
    if (!p.tags.length) return "";
    return '<ul class="tags" aria-label="Built with">' + p.tags.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";
  }
  function photoHTML(p) {
    return '<div class="ph" style="--tone: var(--tone-' + p.id + ')" role="img" aria-label="' + esc(p.photo) + '">' +
      '<div class="ph__inner"></div><span class="ph__label" aria-hidden="true">' + esc(p.photo) + "</span></div>";
  }

  function colourVars(p) { return "--p: var(--tone-" + p.id + "); --p-ink: var(--pink-" + p.id + ")"; }

  function featuredHTML(p) {
    return '<article class="feature" data-project="' + p.id + '" style="' + colourVars(p) + '" aria-labelledby="feature-title">' +
      '<a class="feature__media" href="' + p.href + '" tabindex="-1" aria-hidden="true">' + photoHTML(p) + "</a>" +
      '<div class="page grid feature__body">' +
        '<div class="feature__head">' +
          '<p class="eyebrow" data-copy="projects.featured">Featured</p>' +
          '<h3 class="feature__title display" id="feature-title"><a href="' + p.href + '">' + esc(p.title) + "</a></h3>" +
          '<p class="feature__line">' + esc(p.line) + "</p>" +
        "</div>" +
        '<div class="feature__story">' +
          "<p>" + esc(p.story) + "</p>" +
          tagsHTML(p) +
          '<p><a class="arrow-link" href="' + p.href + '">Read about ' + esc(p.title) + ' <span aria-hidden="true">→</span></a></p>' +
        "</div>" +
      "</div>" +
    "</article>";
  }

  function itemHTML(p) {
    return '<li class="item" data-project="' + p.id + '" style="' + colourVars(p) + '">' +
      '<a class="item__media" href="' + p.href + '" tabindex="-1" aria-hidden="true">' + photoHTML(p) + "</a>" +
      '<div class="item__caption">' +
        '<h3 class="item__title"><a href="' + p.href + '">' + esc(p.title) + "</a></h3>" +
        '<p class="item__line">' + esc(p.line) + "</p>" +
        tagsHTML(p) +
      "</div>" +
    "</li>";
  }

  function render(featuredId) {
    var f = PROJECTS.filter(function (p) { return p.id === featuredId; })[0] || PROJECTS[0];
    return {
      featured: featuredHTML(f),
      grid: PROJECTS.filter(function (p) { return p !== f; }).map(itemHTML).join("")
    };
  }

  function pickId() {
    var wanted = null;
    try { wanted = new URLSearchParams(location.search).get("featured"); } catch (e) {}
    var ids = PROJECTS.map(function (p) { return p.id; });
    if (wanted && ids.indexOf(wanted) !== -1) return wanted;
    return ids[Math.floor(Math.random() * ids.length)];
  }

  var api = { PROJECTS: PROJECTS, render: render };
  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  root.BeeldProjects = api;

  function run() {
    var slot = document.getElementById("featured-slot");
    var grid = document.getElementById("project-grid");
    if (!slot || !grid) return;
    var id = pickId();
    if (slot.getAttribute("data-current") === id) return; // server-rendered state already right
    var out = render(id);
    slot.innerHTML = out.featured;
    grid.innerHTML = out.grid;
    slot.setAttribute("data-current", id);
  }
  // Scripts sit at the end of <body>, so the slots exist: render now, before the voice is applied.
  run();
})(this);
