# Content v5: the real site (Beeld voorop · Nacht · Nuchter)

This deck replaces the placeholder content for the build. Everything here is either confirmed
by Guus in conversation (November 2026) or taken from his own repositories. Anything still open
is marked `[CONFIRM]`. Public-safe: no IPs, hostnames, tailnet names, device IDs, laptop brand or
model, and no links to private repositories.

## Guidance from Guus
- Show **experience, not employers**. No career timeline with company names. The current role
  ("Tech lead, infra team at Harborn") appears once, as the small role line in the hero.
- **Only projects with real substance.** 2nd-hand finds and the Funda finder are only shown
  bundled together as "Scouting agents". Quizmaster is dropped.
- The **homelab platform** (Proxmox, k3s, Argo CD on the laptop) gets its own big story, separate
  from **home automation** (Home Assistant, Zigbee, wall panel).
- Competencies should line up with what infra/DevOps/platform job posts ask for: production
  Kubernetes, GitOps (Argo CD), Terraform/IaC, AWS/Azure, CI/CD, observability
  (Prometheus/Grafana/Loki), security and compliance, and technical leadership.
- Contact: **ekkelenkampguus@gmail.com**, GitHub `guuse`, LinkedIn `[CONFIRM url]`.

---

## 0. Meta
- Title: `Guus Ekkelenkamp, infrastructure & platform engineering`
- Description: `Tech lead infra in Rotterdam. Ten years in development agencies, eight in
  infrastructure: Kubernetes platforms, GitOps, Terraform and cloud.`

## 1. Header
`Guus Ekkelenkamp` · nav: **Experience · Projects · About · Contact**

## 2. Hero
- Kicker: `Rotterdam`
- Headline: **I like building things that _keep running_.**
- Role line: `Tech lead, infra team at Harborn`
- Intro: *Ten years in development agencies, eight of them in infrastructure. I build and run
  the platforms client projects land on: Kubernetes, GitOps and cloud, set up so they're secure,
  repeatable and boring to operate. At home I do the same on a smaller scale.*
- CTAs: `Get in touch` → #contact · `See projects` → #projects
- Now line: `Now: turning one homelab node into three, from second-hand mini PCs.`
- Photos (the loose prints on the mat): **portrait** (`assets/photos/portrait.webp`), the
  **bouldering** shot (`bouldering.webp`), and the **sunset** shot (`sunset.webp`). Alt texts:
  "Guus Ekkelenkamp, portrait"; "Guus bouldering on a sandstone block outdoors"; "Guus at a
  railing at sunset over the water".

## 3. Numbers strip (right under the hero)
| Value | Label |
|---|---|
| 10+ | years in development agencies |
| 8+ | years in infrastructure |
| 1 | cloud-agnostic Kubernetes platform, running for multiple clients |
| 2 | clouds day to day: AWS and Azure |

## 4. Experience
**Title:** Experience
**Intro:** *I've spent my whole career at development agencies, where every client brings a
different stack, a different cloud and a different deadline. For the last eight years I've
worked on the layer underneath: the platform, the pipelines and the security that let many
projects ship without each one reinventing them. Today I lead the infra team.*

### 4.1 Highlight (one larger block)
**A standardised, cloud-agnostic Kubernetes hosting platform.** *I designed and built the
hosting platform our client projects run on. It's the same setup on every cloud, driven from
git, and it's been rolled out for multiple clients. New projects get a namespace, a pipeline and
monitoring on day one instead of in week six.* `[CONFIRM: any numbers you want to add, e.g.
number of clients/apps/clusters]`

### 4.2 What I work on (8 competency blocks: title, one line, 3 bullets, tool chips)
1. **Kubernetes platform engineering**: *Production clusters, and the custom parts that make
   them fit.*
   - Custom operators and CRDs for the things off-the-shelf charts don't cover
   - Helm charts and Kustomize overlays, standardised across projects
   - Upgrades, multi-tenancy and capacity, run in production
   Chips: `kubernetes` `operators` `crds` `helm` `kustomize`
2. **GitOps & delivery**: *Git is the source of truth; the cluster follows.*
   - Argo CD for every environment, with app-of-apps
   - CI with GitHub Actions: build, test and push immutable images
   - Promotion and rollbacks by commit, not by hand
   Chips: `argo-cd` `github-actions` `gitops`
3. **Infrastructure as Code**: *Environments you can rebuild from a repo.*
   - Terraform / OpenTofu modules for networks, clusters, databases and identity
   - The same building blocks reused across clients and clouds
   - Reviews and plans in pull requests before anything changes
   Chips: `terraform` `opentofu`
4. **Cloud: AWS & Azure**: *Mostly AWS, Azure where the client lives there.*
   - AWS: EKS, IAM, VPC, RDS
   - Azure: AKS, Entra ID
   - Landing the same platform on either, without rewriting the apps
   Chips: `aws` `eks` `iam` `vpc` `rds` `azure` `aks` `entra-id`
5. **Observability**: *Know before the client does.*
   - Metrics with Prometheus, dashboards in Grafana, logs in Loki
   - Alerts that point at a cause, not just a symptom
   Chips: `prometheus` `grafana` `loki`
6. **Security & compliance**: *Secure by default, and able to prove it.*
   - ISO 27001 work: policies, controls and audits
   - Least-privilege access, regular access reviews, secrets kept out of git
   - Deciding which tools and AI services may touch client data
   Chips: `iso-27001` `rbac` `least-privilege`
7. **Architecture & leadership**: *Decide early, write it down, bring the team along.*
   - Tech lead of the infra team: priorities, reviews and mentoring
   - Architecture for client systems: where it runs, how it connects, who gets access
   - Decision records, so the reasoning outlives the meeting
8. **AI tooling**: *Let agents do the boring parts, with guardrails.*
   - Claude-based agents, skills and plugins for day-to-day work
   - See the AI tooling project below
   Chips: `claude-code` `mcp` `agents`

### 4.3 How I work (4 short principles)
1. **Boring is a feature.** If a platform is exciting to run, something's wrong.
2. **Everything in git.** Infrastructure, config and decisions. If it's not in a repo, it doesn't exist.
3. **Automate the second time.** Not the first, and certainly not the third.
4. **Write it down.** Every repo of mine starts with a context file and decision records.

### 4.4 Toolbox (grouped, plain text)
- **Platform:** Kubernetes, k3s, Helm, Kustomize, Argo CD, Argo CD Image Updater, cert-manager, Traefik
- **Infrastructure:** Terraform / OpenTofu, AWS, Azure, Proxmox
- **Delivery:** GitHub Actions, Docker, GHCR
- **Observability:** Prometheus, Grafana, Loki
- **Network & security:** Tailscale, Cloudflare (DNS, Tunnel, Access), ISO 27001
- **Code:** TypeScript, Python, Go `[CONFIRM: Go? since operators]`, Java, Bash
- **AI:** Claude Code, MCP, Claude Agent SDK

---

## 5. Projects
Title: **Projects** · Sub: *Things I build outside work.* The featured project rotates per page
load (all five are eligible); without JS the Homelab platform is featured.

Each project has: `id`, title, one-liner, year, status, 2–3 sentence story, a **gallery** (real
screenshots where they exist, otherwise one illustration), "how it works" bullets, numbers
(optional), tech chips, and links (public repos only).

### 5.1 Homelab platform · `homelab` · Live · 2026
- **One-liner:** *A small, production-style Kubernetes platform on an old laptop under the TV.*
- **Story:** *An old laptop with the lid shut runs Proxmox, a single-node k3s cluster and
  everything I build. It's managed the way I'd run a client platform: one git repo, Argo CD
  syncing every app, wildcard TLS, and no open ports. If the disk dies, I rebuild it from the
  repo in an afternoon.*
- **Numbers:** `16 GB` memory · `2` virtual machines · `15` Argo CD applications · `0` open ports
- **RAM budget:** 10 GB k3s · 3 GB Home Assistant · ~2 GB host · ~1 GB spare (show as a bar)
- **How it works:**
  1. Proxmox runs two VMs: Ubuntu with k3s for the apps, and Home Assistant OS (see the next
     project). The laptop battery doubles as a UPS.
  2. Argo CD watches one repo with an app-of-apps root that manages itself. Each app is one
     Application file; adding a repo is adding a file.
  3. GitHub Actions builds every app to an immutable commit-SHA image on GHCR. Argo CD Image
     Updater commits the new tag back to git, and Argo rolls it out.
  4. cert-manager gets one wildcard Let's Encrypt certificate via Cloudflare DNS-01; Traefik
     serves it for every app, so no app needs its own certificate.
  5. Three ways in, all opt-in: the private tailnet by default, a Cloudflare Tunnel with
     Access for a few public hostnames, and Tailscale Funnel for a party-night URL.
- **Decisions (ADR-style, short):**
  - *k3s in a VM, not LXC*: Kubernetes in a container needs privileged mode and breaks on upgrades.
  - *Home Assistant next to the cluster, not in it*: USB passthrough to a VM is one line.
  - *Snapshots, no off-site backups*: everything is rebuildable from git, by choice.
- **Learned the hard way:**
  - *Disk pressure at 30 GiB on a 500 GB SSD: the Ubuntu installer allocated only half the
    disk. One `lvextend`, zero downtime.*
  - *Growing a disk on the host doesn't tell the guest. Resize through Proxmox, not `lvextend`.*
  - *MagicDNS without a global nameserver broke public DNS on every Linux node.*
- **Snippet:** the 10-line Argo CD Application (generic repoURL).
- **Visual:** the architecture illustration (existing) as the main visual.
- **Chips:** `proxmox` `k3s` `argo-cd` `image-updater` `cert-manager` `traefik` `tailscale` `cloudflare`
- **Links:** none (private repo). Show "Repository is private" in small meta.

### 5.2 Home automation · `home` · Live · 2026
- **One-liner:** *Home Assistant, a Zigbee mesh and a wall panel that knows when we're home.*
- **Story:** *Home Assistant runs in its own VM next to the cluster, with the Zigbee stick passed
  straight through. A tablet on the wall is the control panel; lift it off and it's a normal
  tablet again, put it back and it returns to the dashboard. The automations and dashboards are
  versioned in git like everything else.*
- **How it works:**
  1. Home Assistant OS in a VM, with a Zigbee coordinator over USB on an extension cable (USB3
     noise and 2.4 GHz don't mix).
  2. Moved from a Raspberry Pi to the VM with a full backup restore: the whole Zigbee mesh came
     across without re-pairing a single device.
  3. HTTPS through an NGINX proxy in front of HA, with a plain-HTTP fallback on the LAN for when
     the network is having a bad day. A monthly automation renews the certificate.
  4. The wall panel is a Galaxy Tab in a kiosk browser. Charging state tells it it's docked;
     NFC tags tell the wall dock from the desk dock.
- **Real automations** (show as trigger → action rows):
  - Someone is home → wall panel screen on
  - Nobody home → wall panel screen off
  - Tablet docked → dashboard to the foreground
  - Wall-dock NFC tag → control dashboard; desk-dock NFC tag → ops dashboard
  - Time of day → panel brightness
  - Monthly → renew HA certificate (restart the Let's Encrypt and NGINX add-ons)
- **Visual:** a new illustration of the wall panel (room tiles Woonkamer/Keuken/Slaapkamer,
  lights, presence) plus the Zigbee mesh. Photo slot: `PHOTO: the wall panel` `[TODO photo]`.
- **Chips:** `home-assistant` `zigbee` `zha` `fully-kiosk` `nfc`

### 5.3 MTG suite · `mtg` · Live · 2026
- **One-liner:** *Four tools for Magic: The Gathering: play, build, search and brew.*
- **Story:** *Magic is my favourite hobby with friends, and it turned into a small suite of
  software. All of it runs on the homelab.*
- **Parts** (a sub-list, each with its own screenshots):
  1. **Rules of 99**: *Commander in the browser, with full rules enforcement.* An open-source
     rules engine (Forge) runs headless behind a WebSocket gateway; each player only receives
     what they're allowed to see. Rooms with a 6-character code, 2–4 seats, reconnect-safe,
     replays, and a phone layout. Screens: `r99-home.webp`, `r99-table-setup.webp`,
     `r99-workbench.webp`, `r99-replay.webp`, `r99-card.webp`, `r99-home-mobile.webp`.
     Chips: `java` `react` `typescript` `websockets` `sqlite`
  2. **Grimoire**: *A deck library and builder, with an MCP server so Claude can search the whole
     card pool.* Card data in SQLite with full-text search; exact colour-identity and legality
     filters; mana curve, colour sources, categories and a bracket estimate. Screens:
     `grimoire-library.webp`, `grimoire-builder.webp`, `grimoire-rating.webp`, `grimoire-mobile.webp`.
     Chips: `node` `sqlite` `fts5` `mcp`
  3. **Scryfall, in plain words**: *Describe the cards you want; get a working Scryfall query.*
     The Claude Agent SDK writes a query, tests it against Scryfall, and offers stricter and
     broader readings, each with a breakdown of what every part means. Screens:
     `scryfall-result.webp`, `scryfall-mobile.webp` (the real UI, rendered with live Scryfall data).
     Chips: `claude-agent-sdk` `node` `sse`
  4. **claude-mtg-skills** (public): *Claude Code skills that build, upgrade, rate and explain
     real decks.* Seven skills grounded in proven decklists and live prices, installable as a
     Claude Code plugin marketplace, MIT, ≥95% test coverage. Banner: `mtg-skills-banner.webp`.
     Link: https://github.com/guuse/claude-mtg-skills
- **Featured visual:** `r99-home.webp`.

### 5.4 AI tooling · `ai` · Live · 2026
- **One-liner:** *Agents and apps that take the boring parts of the job off my hands.*
- **Story:** *I use Claude every day, and when something is repetitive I'd rather build a tool
  than do it a fourth time. These are the ones I've published.*
- **Parts:**
  1. **Uren-assistent** (public): *From a day's activity to booked hours in one click.* A Tauri 2
     desktop app (React 19, TypeScript, Rust) that turns browser history, calendar and
     GitHub/Linear activity into time blocks, classifies them with an LLM, and books and submits
     them to Simplicate. ≥95% coverage, MIT. Link: https://github.com/guuse/uren-assistent
  2. **ux-testing skill** (public, in `claude-marketplace`): *Autonomous, adversarial UX testing.*
     It maps a web app's user flows, drives a real browser with Playwright, tries to break each
     flow, files a fix task per bug, dispatches an agent to fix it, and re-runs until it passes.
     Link: https://github.com/guuse/claude-marketplace
  3. **claude-mtg-skills**: cross-reference to the MTG suite.
- **Visual:** an illustration (timeline of time blocks being booked, plus a Playwright flow
  check list). No fake screenshots.
- **Chips:** `claude-code` `skills` `playwright` `tauri` `rust` `react`

### 5.5 Scouting agents · `scouts` · Personal · 2026
- **One-liner:** *Two agents that watch Marktplaats, Vinted and Funda so I don't have to.*
- **Story:** *Both run as scheduled Claude routines on my laptop: search, filter, let Claude
  judge each listing against a short brief, and email a digest only when something's worth it.
  One hunts second-hand finds, the other helped us search for a first home.*
- **How it works:**
  1. Search the platforms every two hours (08:00–23:00), skip what was seen, apply hard filters.
  2. Claude judges each survivor against a per-category brief.
  3. A short email digest, price-drop alerts, and a small web UI to keep or hide finds.
- **Numbers:** `281` finds recorded · `every 2 h` · `2` platforms (+ Funda)
- **Screens:** `finds-overview.webp`, `finds-mobile.webp` (the real UI, real public listings).
  No screenshots of the house search: it's private.
- **Chips:** `python` `claude` `astro` `resend`

---

## 6. About
- Title: **About**
- Body: *I live in Rotterdam. Outside work you'll find me bouldering, around a table playing
  Magic with friends, or tinkering with the setup under the TV. I like a weekend with nothing
  planned and a trip somewhere warm.* `[CONFIRM / personalise]`
- Photos: bouldering (tall) and sunset (tall), with captions `fig. — bouldering` and
  `fig. — somewhere warm`.
- "Currently" list:
  - **climbing**: bouldering, mostly outdoors when the weather allows `[CONFIRM]`
  - **playing**: Commander with friends, on Rules of 99 when we can't meet up
  - **building**: the 3-node homelab cluster

## 7. Contact
- Title: **Contact** · Big address: **ekkelenkampguus@gmail.com** (selectable + copy button)
- Line: *Want to work together, or talk Kubernetes? Send me an email.*
- Links: GitHub (https://github.com/guuse) · LinkedIn `[CONFIRM url]`
- Footer: `© 2026 Guus Ekkelenkamp` · status line (illustrative: `all systems normal · last
  deploy <sha> · <date>`, filled at build time) · Back to top
