/*
 * r2-licht · project data + featured rotation.
 * The HTML ships with the Homelab featured (no-JS state). On load we pick one project
 * at random (or ?featured=<id>), render it in the feature slot and list the rest in order.
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
      year: "2026",
      photo: "Photo: the setup under the TV",
      href: "project.html"
    },
    {
      id: "rules-of-99",
      title: "Rules of 99",
      line: "Play Commander (Magic: The Gathering) with friends in the browser.",
      story: "Import a deck, share a room code, and play with up to four people. An open-source rules engine handles the rules, so nobody has to argue about them. Works on phones too.",
      tags: ["Java", "React", "TypeScript", "WebSockets"],
      year: "2025",
      photo: "Screenshot: a four-player game",
      href: "project.html"
    },
    {
      id: "finds",
      title: "2nd-hand finds",
      line: "A tool that keeps an eye on Marktplaats and Vinted for me.",
      story: "Every two hours it checks for things I’m looking for, like Magic card collections or cheap mini PCs, and uses AI to filter out the noise. The good ones arrive in a short email.",
      tags: ["Python", "Claude", "Astro"],
      year: "2026",
      photo: "Screenshot: the finds overview",
      href: "project.html"
    },
    {
      id: "quizmaster",
      title: "Quizmaster",
      line: "A live party quiz with questions generated on the spot.",
      story: "Everyone joins on their phone, picks a theme, and the questions are made up as you play. Built for one birthday, used at every party since.",
      tags: [],
      year: "2025",
      photo: "Screenshot: the quiz on a phone",
      href: "project.html"
    },
    {
      id: "scryfall",
      title: "Scryfall, in plain words",
      line: "Search Magic cards by describing what you want.",
      story: "Type “cheap green cards that ramp” and it turns that into a proper Scryfall search, checks that it returns results, and sends you there.",
      tags: ["Claude", "TypeScript"],
      year: "2025",
      photo: "Screenshot: search box and results",
      href: "project.html"
    }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function tags(p, plain) {
    if (!p.tags.length) return "";
    return '<ul class="tags' + (plain ? " tags--plain" : "") + '" aria-label="Built with">' +
      p.tags.map(function (t) { return '<li class="tag">' + esc(t) + "</li>"; }).join("") + "</ul>";
  }

  function ph(p) {
    return '<div class="ph" data-tone="' + p.id + '" role="img" aria-label="' + esc(p.photo) + '">' +
      '<span class="ph__cap" aria-hidden="true">' + esc(p.photo) + "</span></div>";
  }

  function renderFeature(p) {
    return '<a class="feature" href="' + p.href + '" data-id="' + p.id + '">' +
      ph(p) +
      '<div class="feature__body">' +
        "<div>" +
          '<p class="feature__eyebrow">Featured · a different one each visit</p>' +
          '<h3 class="feature__title">' + esc(p.title) + "</h3>" +
          '<div class="feature__meta">' + tags(p, false) +
            '<span class="feature__year">' + p.year + "</span></div>" +
        "</div>" +
        "<div>" +
          '<p class="feature__story">' + esc(p.story) + "</p>" +
          '<span class="feature__cta">Read about the project <span class="arrow" aria-hidden="true">→</span></span>' +
        "</div>" +
      "</div></a>";
  }

  function renderRow(p) {
    return '<li><a class="prow" href="' + p.href + '" data-id="' + p.id + '">' +
      ph(p) +
      '<div><h4 class="prow__title">' + esc(p.title) +
        ' <span class="arrow" aria-hidden="true">→</span></h4>' +
        '<p class="prow__line">' + esc(p.line) + "</p></div>" +
      '<div class="prow__side">' + (tags(p, true) || "<span></span>") +
        '<span class="prow__year">' + p.year + "</span></div>" +
      "</a></li>";
  }

  function pick(search) {
    var m = /[?&]featured=([^&#]+)/.exec(search || "");
    var wanted = m && decodeURIComponent(m[1]);
    for (var i = 0; i < PROJECTS.length; i++) if (PROJECTS[i].id === wanted) return PROJECTS[i];
    return PROJECTS[Math.floor(Math.random() * PROJECTS.length)];
  }

  function render(featured) {
    return {
      feature: renderFeature(featured),
      list: PROJECTS.filter(function (p) { return p.id !== featured.id; }).map(renderRow).join("")
    };
  }

  var api = { PROJECTS: PROJECTS, render: render, pick: pick, byId: function (id) {
    return PROJECTS.filter(function (p) { return p.id === id; })[0];
  } };

  if (typeof module !== "undefined" && module.exports) { module.exports = api; return; }
  root.Projects = api;

  // Browser: rotate on the homepage.
  var slot = document.getElementById("featured");
  var list = document.getElementById("project-list");
  if (slot && list) {
    var f = pick(location.search);
    if (slot.firstElementChild && slot.firstElementChild.getAttribute("data-id") !== f.id) {
      var out = render(f);
      slot.innerHTML = out.feature;
      list.innerHTML = out.list;
    }
    document.documentElement.setAttribute("data-featured", f.id);
  }
})(this);
