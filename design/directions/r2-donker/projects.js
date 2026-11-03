/*
 * r2-donker · project data + featured rotation.
 * The HTML ships with the Homelab featured (no-JS state). On load we pick one project at
 * random (or ?featured=<id>), render it in the feature layout and list the rest in order.
 */
(function () {
  "use strict";

  var PROJECTS = [
    {
      id: "homelab",
      title: "Homelab & home automation",
      line: "A small home server that runs my apps and my home automation.",
      story: "An old laptop under the TV runs everything: my side projects, Home Assistant and the lights. It’s only reachable through my own private network, and every change goes through git, so I can rebuild it in an afternoon. Next up: three small second-hand PCs to turn it into a proper cluster.",
      tags: ["Proxmox", "Kubernetes", "Home Assistant", "Zigbee"],
      image: "Photo: the setup under the TV"
    },
    {
      id: "rules-of-99",
      title: "Rules of 99",
      line: "Play Commander (Magic: The Gathering) with friends in the browser.",
      story: "Import a deck, share a room code, and play with up to four people. An open-source rules engine handles the rules, so nobody has to argue about them. Works on phones too.",
      tags: ["Java", "React", "TypeScript", "WebSockets"],
      image: "Screenshot: a 4-player game"
    },
    {
      id: "finds",
      title: "2nd-hand finds",
      line: "A tool that keeps an eye on Marktplaats and Vinted for me.",
      story: "Every two hours it checks for things I’m looking for, like Magic card collections or cheap mini PCs, and uses AI to filter out the noise. The good ones arrive in a short email.",
      tags: ["Python", "Claude", "Astro"],
      image: "Screenshot: the finds overview"
    },
    {
      id: "quizmaster",
      title: "Quizmaster",
      line: "A live party quiz with questions generated on the spot.",
      story: "Everyone joins on their phone, picks a theme, and the questions are made up as you play. Built for one birthday, used at every party since.",
      tags: [],
      tagsTodo: "Stack to confirm",
      image: "Screenshot: the quiz on a phone"
    },
    {
      id: "scryfall",
      title: "Scryfall, in plain words",
      line: "Search Magic cards by describing what you want.",
      story: "Type “cheap green cards that ramp” and it turns that into a proper Scryfall search, checks that it returns results, and sends you there.",
      tags: ["Claude", "TypeScript"],
      image: "Screenshot: search box and results"
    }
  ];

  var HREF = "project.html"; // every project links to the template page for now
  var DEFAULT_ID = "homelab";

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function tagsHTML(p) {
    var items = p.tags.map(function (t) { return '<li class="tag">' + esc(t) + "</li>"; });
    if (p.tagsTodo) items.push('<li class="tag tag--todo">' + esc(p.tagsTodo) + "</li>");
    return '<ul class="tags" aria-label="Built with">' + items.join("") + "</ul>";
  }

  function phHTML(p) {
    return '<div class="ph" data-tone="' + esc(p.id) + '" role="img" aria-label="Placeholder: ' + esc(p.image) + '">' +
      '<span class="ph__cap" aria-hidden="true">' + esc(p.image) + "</span></div>";
  }

  function withOption(href) {
    var o = document.documentElement.getAttribute("data-option");
    return o && o !== "nacht" ? href + "?option=" + o : href;
  }

  function featureHTML(p) {
    return '<div class="feature__media">' + phHTML(p) + "</div>" +
      '<div class="feature__body">' +
        '<p class="feature__eyebrow" data-copy="projects.featured">Featured</p>' +
        '<h3 class="feature__title"><a href="' + withOption(HREF) + '">' + esc(p.title) + "</a></h3>" +
        '<p class="feature__story">' + esc(p.story) + "</p>" +
        tagsHTML(p) +
        '<p class="feature__more" aria-hidden="true"><span>Read the project</span><span class="arrow">→</span></p>' +
      "</div>";
  }

  function cardHTML(p, wide) {
    return '<li class="card' + (wide ? " card--wide" : "") + '" data-id="' + esc(p.id) + '" data-tone="' + esc(p.id) + '">' +
      '<div class="card__media">' + phHTML(p) + "</div>" +
      '<div class="card__head"><h3 class="card__title"><a href="' + withOption(HREF) + '">' + esc(p.title) + '</a></h3><span class="arrow" aria-hidden="true">→</span></div>' +
      '<p class="card__line">' + esc(p.line) + "</p>" +
      tagsHTML(p) +
    "</li>";
  }

  function pickFeatured() {
    var q = null;
    try { q = new URLSearchParams(location.search).get("featured"); } catch (e) {}
    if (q && PROJECTS.some(function (p) { return p.id === q; })) return q;
    return PROJECTS[Math.floor(Math.random() * PROJECTS.length)].id;
  }

  function renderHome() {
    var featureEl = document.getElementById("feature");
    var listEl = document.getElementById("project-list");
    if (!featureEl || !listEl) return;
    var id = pickFeatured();
    var featured = PROJECTS.filter(function (p) { return p.id === id; })[0];
    var rest = PROJECTS.filter(function (p) { return p.id !== id; });
    featureEl.innerHTML = featureHTML(featured);
    featureEl.setAttribute("data-id", id);
    featureEl.setAttribute("data-tone", id);
    var voice = document.documentElement.getAttribute("data-copy-voice");
    if (window.EkkCopy && voice) window.EkkCopy.apply(voice, featureEl);
    // Odd count -> last card spans the full row, so the grid never leaves a lonely card.
    listEl.innerHTML = rest.map(function (p, i) {
      return cardHTML(p, rest.length % 2 === 1 && i === rest.length - 1);
    }).join("");
  }

  function renderNext() {
    var el = document.getElementById("next-project");
    if (!el) return;
    var current = el.getAttribute("data-current") || DEFAULT_ID;
    var i = PROJECTS.map(function (p) { return p.id; }).indexOf(current);
    var next = PROJECTS[(i + 1) % PROJECTS.length];
    el.querySelector("[data-next-title]").textContent = next.title;
    el.querySelector("[data-next-line]").textContent = next.line;
    el.querySelector("[data-next-media]").innerHTML = phHTML(next);
    el.setAttribute("data-tone", next.id);
  }

  window.DonkerProjects = { list: PROJECTS, render: renderHome };

  function init() { renderHome(); renderNext(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
