/*
 * ekkelenkamp.dev: copy voices (round 2b)
 *
 * The same site in four voices. Every direction marks its text nodes with
 * data-copy="<key>" and calls EkkCopy.apply(voice). The HTML ships with the
 * "nuchter" voice server-rendered, so the page reads fine without JS.
 *
 * Strings may contain <em>…</em> to mark ONE emphasised word or phrase; each
 * direction styles <em> in its own playful way. Everything else is plain text.
 * The job title lives in `hero.role` as a small fact, never in the headline.
 */
(function () {
  const VOICES = {
    nuchter: {
      label: "Nuchter",
      "hero.kicker": "Rotterdam",
      "hero.headline": "I like building things that <em>keep running</em>.",
      "hero.intro": "I'm Guus. At Harborn I make sure client platforms are secure and reliable. At home I keep going: a few web apps, a small server and more home automation than one apartment needs.",
      "hero.role": "Tech lead, infra team at Harborn",
      "cta.primary": "Get in touch",
      "cta.secondary": "See projects",
      "nav.work": "Work", "nav.projects": "Projects", "nav.about": "About", "nav.contact": "Contact",
      "work.title": "Work",
      "work.intro": "I'm tech lead of the infra team at Harborn, a digital agency in Rotterdam and Amsterdam. Before a client project gets built, we decide where it runs, how it's set up and who gets access to what.",
      "projects.title": "Projects",
      "projects.sub": "Things I build outside work.",
      "projects.featured": "Featured",
      "projects.more": "More projects",
      "about.title": "About",
      "about.body": "I live in Rotterdam. When I'm not working I'm usually tinkering with something at home, playing Magic with friends, or scrolling Marktplaats for things I don't need.",
      "contact.title": "Contact",
      "contact.body": "Want to work together or just say hi? Send me an email.",
      "footer.note": "© 2026 Guus Ekkelenkamp",
    },
    speels: {
      label: "Speels",
      "hero.kicker": "Hey, I'm Guus",
      "hero.headline": "Infrastructure by day. <em>Side projects</em> by night.",
      "hero.intro": "By day I keep client platforms at Harborn in good shape. After hours there's a tiny server under my TV, a Magic deck on the table and lights that switch themselves off.",
      "hero.role": "Tech lead, infra team at Harborn",
      "cta.primary": "Say hi",
      "cta.secondary": "See what I made",
      "nav.work": "Work", "nav.projects": "Made", "nav.about": "Me", "nav.contact": "Say hi",
      "work.title": "What I do all day",
      "work.intro": "At Harborn I lead the infra team. Before anyone writes a line of code for a client, we figure out where it runs, how it's built and who gets the keys.",
      "projects.title": "Things I made",
      "projects.sub": "Built for fun, kept around longer than planned.",
      "projects.featured": "Today's pick",
      "projects.more": "And also",
      "about.title": "Off the clock",
      "about.body": "Rotterdam is home. You'll find me tinkering with the setup under the TV, losing at Magic with friends, or on Marktplaats looking for something I definitely don't need.",
      "contact.title": "Let's talk",
      "contact.body": "Got a question, an idea or a Commander deck that needs testing? My inbox is open.",
      "footer.note": "Made in Rotterdam · © 2026",
    },
    persoonlijk: {
      label: "Persoonlijk",
      "hero.kicker": "Guus Ekkelenkamp",
      "hero.headline": "I make the internet a bit more reliable, and my home a bit <em>smarter</em>.",
      "hero.intro": "I work in Rotterdam, where I help clients build platforms that are secure and easy to keep running. At home the curiosity doesn't switch off, so I build things there too.",
      "hero.role": "Tech lead, infra team at Harborn",
      "cta.primary": "Send me a message",
      "cta.secondary": "Things I've built",
      "nav.work": "Work", "nav.projects": "Projects", "nav.about": "About me", "nav.contact": "Get in touch",
      "work.title": "My work",
      "work.intro": "At Harborn I lead the infra team. I like the part before a project starts: thinking through where it will run, how it fits together, and how to keep it safe.",
      "projects.title": "Things I've built",
      "projects.sub": "Mostly for myself, sometimes for friends, always to learn something.",
      "projects.featured": "In the spotlight",
      "projects.more": "Other projects",
      "about.title": "A bit about me",
      "about.body": "I live in Rotterdam. I'm happiest with a half-finished project on my desk, friends around the table for a game of Magic, and a weekend with nothing planned.",
      "contact.title": "Get in touch",
      "contact.body": "Whether it's work, a project or just a question, I'd like to hear from you.",
      "footer.note": "© 2026 Guus Ekkelenkamp · Rotterdam",
    },
    kort: {
      label: "Kort",
      "hero.kicker": "Rotterdam, NL",
      "hero.headline": "Guus. Builds things. <em>Usually</em> finishes them.",
      "hero.intro": "Infra team lead at Harborn. Side projects at home. Both are on this page.",
      "hero.role": "Tech lead, infra team at Harborn",
      "cta.primary": "Email",
      "cta.secondary": "Projects",
      "nav.work": "Work", "nav.projects": "Projects", "nav.about": "About", "nav.contact": "Email",
      "work.title": "Work",
      "work.intro": "Tech lead of the infra team at Harborn. Security, the cloud platform, and the architecture decisions in between.",
      "projects.title": "Projects",
      "projects.sub": "After hours.",
      "projects.featured": "Featured",
      "projects.more": "More",
      "about.title": "About",
      "about.body": "Rotterdam. Magic with friends. Too many browser tabs open on Marktplaats.",
      "contact.title": "Contact",
      "contact.body": "One address, I read everything.",
      "footer.note": "© 2026",
    },
  };

  const ORDER = ["nuchter", "speels", "persoonlijk", "kort"];

  function apply(voice, root) {
    const v = VOICES[voice] || VOICES.nuchter;
    (root || document).querySelectorAll("[data-copy]").forEach((el) => {
      const key = el.getAttribute("data-copy");
      if (!(key in v)) return;
      // Trusted, local strings; only <em> markup is used.
      el.innerHTML = v[key];
    });
    document.documentElement.setAttribute("data-copy-voice", VOICES[voice] ? voice : "nuchter");
  }

  window.EkkCopy = { VOICES, ORDER, apply };
})();
