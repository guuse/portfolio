# v7: CV homepage + separate project pages (synthesis of four reviews)

Guus: *"It still feels like a mess and a dump of info on the homepage. Organise it. The homepage
should feel like a CV that links to the projects where things are implemented. Get rid of the
AI-created vibe."*

Four independent reviews (visual designer, hiring manager + recruiter, senior SRE peer,
information architect) reached the same conclusions. This document is the agreed plan.
Their raw reports were working notes and aren't kept; this is what they agreed on.

---

## A. Site map
- `/` (`index.html`): **the CV.** About 3 desktop screens, ≤ 550 words. No diagrams, no
  animation beyond subtle hover states.
- `/projects/hosting-platform` (`platform.html`): case study, work.
- `/projects/homelab` (`homelab.html`): case study, personal.
- `/projects/mtg-suite` (`mtg.html`): case study, personal, with anchors for the four tools.
- Each project is a **real page with its own URL** (not a modal). In the artifact, publish them
  as separate HTML files next to the homepage.

## B. Homepage (CV), in this order
1. **Header:** name (links home) · nav: Experience · Projects · About · Contact.
2. **Intro** (one screen, left text, one straight portrait on the right; no mat, no ruler, no
   tilted prints, no italic accent word, no squiggle):
   - `Guus Ekkelenkamp`
   - `Tech lead infrastructure · Harborn · Rotterdam`
   - Two sentences: *I build and run the platforms our client projects run on: Kubernetes,
     GitOps and infrastructure as code on AWS and Azure. Ten years at the same agency, from
     front-end intern to leading the infra team, and I still write code most days.*
   - Contact row right there: email · LinkedIn · GitHub (· CV PDF later).
   - Keep the headline "I like building things that keep running." only if it can sit as a
     small, quiet line; otherwise drop it. No accent styling on it.
3. **Experience** (the spine; reverse-chronological; one employer, so present it as phases):
   - **Harborn, Rotterdam · 2016–now** `[CONFIRM exact years]`
     - **Tech lead, infrastructure · 20XX–now** `[CONFIRM]`. 3–4 outcome bullets, each linking
       to the evidence:
       - Designed and built the hosting platform the agency runs on: 8 Kubernetes clusters in
         the Netherlands, elsewhere in Europe and Japan, the largest above 1,500 pods →
         *Hosting platform case study*
       - Moved infrastructure delivery to Pulumi with policy checks, review and drift gates, so
         only the pipeline changes production → *case study, infra pipeline*
       - Led the infra team: priorities, reviews, mentoring, and training programmes with clients.
       - ISO 27001 work: policies, controls and audits `[CONFIRM role]`.
     - **Infrastructure engineer · 2020–20XX** `[CONFIRM]`: cloud foundations and serverless
       architecture on AWS, fully as code; later moving towards architecture, while still
       building tools and automation that make developers' lives easier.
     - **Back-end & serverless developer · 2017–2020** `[CONFIRM]`: back-end services and
       serverless applications, infrastructure as code from day one.
     - **Front-end developer (internship, then junior) · 2016–2017** `[CONFIRM]`.
   - The phases show the path from development to infra. Keep it short and plain.
4. **Skills** (a typeset list, 5–6 lines, no chips, no cards):
   - Kubernetes & GitOps: EKS, AKS, k3s, Argo CD, Helm, Kustomize, custom operators in Python
   - Infrastructure as code: Pulumi (Python), Terraform
   - Cloud: AWS (EKS, IAM, VPC, RDS/Aurora), Azure (AKS, Entra ID)
   - Delivery & observability: GitHub Actions, Prometheus, Grafana, Loki
   - Security: ISO 27001, least-privilege IAM, OIDC, policy as code
   - Code: Python, TypeScript, Java
5. **Selected work** (3 rows: a small **static** thumbnail, title, one sentence, "work" or
   "personal" + years, a link "Read the case study"):
   - Hosting platform: *A cloud platform for the agency's client projects: 8 clusters, one way of
     working.* (thumbnail: a static frame of the delivery diagram)
   - Homelab: *The same patterns on one old laptop: k3s, Argo CD, Home Assistant, no open ports.*
   - MTG suite: *Four tools for Magic: The Gathering, running on the homelab.* (thumbnail:
     Rules of 99 screenshot)
   - Then **Also** (the existing hairline list): Uren-assistent, ux-testing skill, Scouting agents.
6. **Education, certifications, languages** (3 short lines) `[CONFIRM content]`:
   - Education: `[CONFIRM: study, school, year]`
   - Certifications: `[CONFIRM]`
   - Languages: Dutch (native), English (fluent)
7. **About / outside work** (one short paragraph + 2 photos, bouldering and sunset, straight,
   no links to projects): *Outside work I'm usually bouldering, travelling somewhere warm, or
   playing Commander with friends.*
8. **Contact** (the big email, kept) + footer (© and links only; **delete the fake status line**).

**Each fact lives in one place on the homepage.** 8 clusters / 1,500+ pods appear once (in the
experience bullet). Years appear once (in the intro or the experience heading). The homelab
laptop appears once (in Selected work).

## C. Project page template
Title · one line · role, period, work/personal · back to CV
1. **Context**: the problem, 2–4 sentences.
2. **Overview diagram** (one, animated, the best one).
3. **2–4 deep-dive sections**, each: a heading in plain words (no slogans), a short paragraph,
   bullets only where they help, and its diagram next to it. Keep the existing diagrams, with
   the corrections in section D.
4. **Results**: the numbers, stated once, with context.
5. **Trade-offs and what I'd change**: at least one honest one per project.
6. **Lessons / gotchas**: written as symptom → cause → fix.
7. **Stack**: one plain line.
8. Next project · Back to CV.

## D. Technical corrections (from the SRE review)
- Observability: "Alerts on what users feel (symptoms and SLOs), each with a runbook that points
  at likely causes." Replace "alerts that point at a cause, not a symptom".
- Title: "AWS-first, the same platform on Azure" instead of "cloud-agnostic" as the headline
  claim. Say what differs on AKS in one line `[CONFIRM if known; otherwise just "Azure where the
  client lives"]`.
- Delivery diagram: CI → **registry** ← Image Updater (watches) → **commits the new image
  version to git** → Argo CD syncs. No "tag in git".
- Argo snippet: make it valid (add `project`, `destination`) and show the Image Updater bits that
  matter (update strategy, git write-back), generic names only.
- Multi-region: state how routing works ("CloudFront cache behaviours route by path to the
  regional origin"), and that the resource syncer predates the GitOps move (what we'd do now:
  Argo CD ApplicationSets targeting both clusters).
- ingress-nginx: add one line that the platform is moving off ingress-nginx `[CONFIRM target:
  Gateway API?]`. Leave it out if Guus doesn't confirm.
- Homelab: never "production-grade". Say "the same patterns I use at work, on one node".
- The gotchas as symptom → cause → fix, consistent: grow the disk in Proxmox (`qm resize`), then
  `growpart`/`pvresize`/`lvextend` inside the guest.
- "fails at preview" instead of "can't even be previewed". Tailnet = "default", the other two
  are opt-in.
- Explain main vs releases: at work, production follows release tags (main never deploys); at
  home, main deploys directly, by choice.
- "Custom operators in Python": name one only if Guus gives one; otherwise keep it in the
  skills line only.
- Mechanism for "the deploy role can't widen its own permissions": its IAM writes are limited
  to a name prefix that can't match the pipeline roles.

## E. Anti-"AI vibe" rules (non-negotiable)
Remove:
- **All numbering**: 01–04, 01–08, 01–05, 01–03, a–g, "project 01 of 03", ghost numerals.
- **Mono lowercase micro-labels** as section kickers ("what I work on", "also", "replay",
  "hosting platform"). Mono only for code, commands and real identifiers.
- **Fake telemetry**: the footer status line, made-up SHAs/versions/PR numbers on the homepage,
  the pulsing "Now:" dot, the ruler and cutting-mat grid.
- **Slogan sublines and quips**: "Know before the client does.", "Secure by default, and able to
  prove it.", "Planned, not urgent.", "Push to main and walk away.", "Nobody asked for it.",
  "Complete overkill…", "It got out of hand", "Ideally both, ideally with a sunset", "no heroes
  at 3 a.m.". Also rhetorical triplets.
- **Over-explaining the UI**: "Five habits, each with…", "One from work, two from home. Open
  one…".
- **Card grids as the default layout**, chip clouds on every block, icon-on-every-card,
  tinted gradient cards, alternating left/right rows, three accent colours.
- **The italic accent word with a squiggle underline.**
Use instead:
- Typeset lists, hairline rules, a clear typographic hierarchy, generous but not padded spacing.
- **One accent colour**, used rarely (links, one highlight).
- Plain, specific sentences in Guus's voice: first person, concrete, no slogans. A reader should
  be able to imagine Guus saying it out loud.
- Real data only. Illustrative values appear only inside the project-page diagrams, and look like
  examples (no fake "all systems normal").
- Fewer type styles: one serif for headings is fine, one sans for text, and mono only for code.

## F. Keep
- The real photos (fewer, straight), the Also list's hairline layout, the big serif email, the
  plain-language principles (moved to the platform page as "Principles", or 3 lines on the
  homepage under Experience), the animated diagrams (project pages only), the platform content
  (policy at preview, saved plan, non-author review, fail-closed drift gate, no static keys, CLI
  without apply, Loki retention, workload identity), homelab "getting in", Rules of 99
  "each player only receives what they're allowed to see", the colour palette Nacht.
