# Content v6: stronger story, three projects, DevOps front and centre

Feedback round 6 from Guus (summarised):
- Home automation as its own project is too default; the wall panel is boring. **Merge it into
  the homelab** and tell the DevOps side: Proxmox, Tailscale, own domain, TLS, tunnels.
- The homelab must be **sexy**: a fully automated Kubernetes environment with serious CI/CD.
  Total overkill for a home, and great fun to maintain.
- The hero shows **personal photos** (not Grimoire/Rules of 99 screenshots).
- **Projects are static, three of them:** 1. the hosting platform, 2. homelab + Home Assistant,
  3. the MTG suite. The rest goes in a small "Also" list.
- The **illustrations must be much better**, with animations that explain how things work.
- **Black text on blue is unreadable** (bug in the artifact: body text colour not applied).
- **Start with personal things**: bouldering, travel, Magic, tinkering.
- **"How I work" is boring** and "Boring is a feature" is unclear: rewrite with understandable
  principles.
- **The hosting platform must be worked out properly** (Pulumi, logging pipelines, etc.) and be
  **project #1**.

Public-safety for work content: no client names, no account IDs, cluster names, internal
hostnames or repo names. Describe the architecture and the practices, not the address book.

---

## Page order
1. Header · 2. Hero · 3. **Off the clock** (personal) · 4. Numbers · 5. Experience ·
6. Projects (3 + Also) · 7. Contact · Footer

## 2. Hero
- Kicker `Rotterdam`; headline **I like building things that _keep running_.**; role line
  `Tech lead, infra team at Harborn`.
- Intro: *Ten years in development agencies, eight of them in infrastructure. I build the
  platforms client projects run on, and automate them until they mostly run themselves.
  Outside work you'll find me on a boulder, on a plane, or behind a deck of Magic cards.*
- Prints on the mat: **portrait** (main), **bouldering**, **sunset**. No screenshots in the hero.

## 3. Off the clock (directly under the hero)
Heading: **Off the clock** · Sub: *What I do when I'm not doing infra.*
Four interests, each with a short line; hovering one lifts the matching print in the hero
(bouldering and travel have photos; Magic and tinkering link to their projects):
- **Bouldering**: *Indoors after work, outdoors on sandstone whenever there's a weekend and dry
  weather. It's problem-solving with your whole body.*
- **Travel**: *Somewhere warm, somewhere new. Ideally both, ideally with a sunset.*
- **Magic: The Gathering**: *Commander with friends. It got out of hand: I built my own suite of
  tools for it* → links to the MTG project.
- **Tinkering at home**: *An old laptop under the TV runs a production-grade Kubernetes
  platform. Nobody asked for it* → links to the homelab project.

## 4. Numbers strip
`10+` years in development agencies · `8+` years in infrastructure · `8` Kubernetes clusters, NL
and abroad · `1,500+` pods on the largest

## 5. Experience
Keep the intro and the 8 competency blocks from v5 (they work), with two changes: block 3
becomes **Infrastructure as Code: Terraform & Pulumi** (Pulumi in Python, policy-as-code,
pipeline-only applies), and the highlight block is replaced by a short pointer: *The platform
I'm proudest of is project #1 below.*

### How I work (rewrite: 5 principles, plain words, each with a concrete example)
1. **If I do it twice, I automate it.** *Onboarding a new app is adding a topic to its repo; the
   platform does the rest.*
2. **Every change goes through a pull request.** *Even infrastructure: the review shows exactly
   what will change, and merging is the deploy. Nobody runs commands against production from a
   laptop.*
3. **Guardrails before features.** *I write the rule that blocks a mistake before I build the
   thing it protects. A misconfigured bucket can't even be previewed.*
4. **Make it boring to run.** *A good platform doesn't need heroes at 3 a.m.: it heals itself,
   alerts with a reason, and anyone on the team can operate it.* (replaces "Boring is a feature")
5. **Write down why, and teach it.** *Decision records in every repo, and training sessions with
   clients, so the knowledge doesn't live only in my head.*

## 6. Projects (static order, no rotation)

### 6.1 Hosting platform · `platform` · Work · 2019–now `[CONFIRM start year]`
- **Title:** *A cloud-agnostic Kubernetes hosting platform*
- **One-liner:** *The platform our client projects run on: eight clusters, one way of working.*
- **Story:** *Every client used to get a slightly different setup. I designed one platform
  instead: the same building blocks on AWS or Azure, the same pipelines, the same monitoring.
  It now runs eight clusters, from small to large, in the Netherlands and abroad, including
  Japan. The biggest runs more than 1,500 pods. New apps get production and acceptance
  environments, TLS, logging and dashboards on day one, without anyone touching the cluster.*
- **Numbers:** `8` clusters · `1,500+` pods on the largest · `~80` Argo CD applications on the
  main cluster · `0` static cloud keys in CI
- **Section A: App delivery (GitOps with Argo CD).** Animated diagram.
  - A root app-of-apps manages everything; projects act as guardrails per team or client.
  - Each app gets **production** and **acceptance**: production follows the newest stable
    release, acceptance the newest release candidate. Main builds never deploy.
  - CI builds immutable version tags; Argo CD Image Updater commits the new tag back to git, and
    Argo syncs. Nobody edits the cluster by hand.
  - Onboarding a conventional repo: add a GitHub topic, and an ApplicationSet creates both
    environments.
- **Section B: Infrastructure delivery (Pulumi, push-based GitOps).** Animated pipeline:
  `PR → tests + policy-enforced preview → saved plan → non-author review → merge → refresh +
  drift gate → apply`, plus a daily drift check and Slack notifications.
  - Pulumi in Python, one independent state per concern, each with its own foundation.
  - **Policy-first:** a CrossGuard policy pack runs as mandatory, so a resource that breaks a
    rule can never preview, let alone apply.
  - **Test-driven infrastructure:** logic in importable modules, resource shapes tested with
    Pulumi mocks.
  - **The pipeline is the only writer to production.** Apply re-plans against fresh state and
    refuses anything destructive the reviewers didn't approve (fail-closed drift gate).
  - **No static keys:** GitHub OIDC into short-lived cloud roles, on self-hosted runners in the
    cluster. The deploy role can never widen its own permissions.
  - Reusable composite GitHub Actions for preview, deploy and drift, shared by every infra repo.
- **Section C: Logging pipeline.** Animated flow: `pods → Alloy (on every node) → Loki → object
  storage (encrypted)` → Grafana.
  - Alloy runs on every node; Loki and its caches run on a dedicated platform node pool.
  - Logs go to encrypted object storage; retention (90 days) is owned by Loki's compactor, never
    by bucket lifecycle rules, because that would corrupt queries.
  - The bucket is reachable by exactly one service account, through workload identity.
- **Section D: Operating it.** A small CLI we built (Python) that knows every environment: SSO
  login with admin or read-only roles, a bastion shell without opening ports, policy-enforced
  previews, and bootstrapping a new environment's foundation. It deliberately has no `apply`.
- **Also running on the platform** (one line): *metrics and dashboards (Grafana), network
  observability, an LLM gateway in front of a GPU box, and MCP servers so AI agents can read the
  cluster safely.*
- **Chips:** `kubernetes` `argo-cd` `image-updater` `pulumi` `python` `crossguard` `github-actions`
  `oidc` `loki` `alloy` `grafana` `aws` `azure`
- No screenshots (private). Visuals: three animated diagrams.

### 6.2 Homelab & home automation · `homelab` · Personal · 2026
- **Title:** *A fully automated Kubernetes platform, for one apartment*
- **One-liner:** *Complete overkill for a home. Great fun to maintain.*
- **Story:** *An old laptop under the TV, lid shut, runs the same kind of platform I build at
  work, just smaller. Proxmox hosts a k3s cluster and Home Assistant. Every app is built, tagged
  and rolled out from git without me touching anything. It has its own domain, real
  certificates, and no open ports. The battery doubles as a UPS.*
- **Numbers:** `15` Argo CD apps · `2` VMs · `0` open ports · `3` ways in, all opt-in
- **Section A: From git push to running.** Animated: `git push → GitHub Actions → commit-SHA
  image on GHCR → Argo CD Image Updater writes the tag to git → Argo CD syncs → rollout`.
- **Section B: Getting in.** Animated network diagram:
  - **Tailnet** (default): my devices → Tailscale → Traefik → app; DNS for my own domain points
    at the tailnet, so it only resolves to something reachable on my devices.
  - **Cloudflare Tunnel + Access**: a few apps are public on a friendly hostname, behind a login,
    without opening a port.
  - **Tailscale Funnel**: a temporary public URL, for the quiz at a party.
  - TLS everywhere: one wildcard Let's Encrypt certificate via Cloudflare DNS-01, served by
    Traefik for every app.
- **Section C: Inside the box.** Proxmox → VM 1: Ubuntu + k3s (10 GB) · VM 2: Home Assistant OS
  (3 GB) with the Zigbee stick passed through · host ~2 GB · ~1 GB spare. Snapshots before every
  upgrade.
- **Section D: Home Assistant, the DevOps way.** In its own VM, not in the cluster (USB
  passthrough). TLS through an NGINX proxy, plain-HTTP fallback on the LAN for when things break,
  and a monthly automation that renews its certificate. Moved from a Raspberry Pi with a full
  restore: the whole Zigbee mesh came across without re-pairing anything. Dashboards and
  automations live in git. (The wall panel is one line here: *a tablet on the wall shows it all.*)
- **Section E: Learned the hard way** (keep the three gotchas).
- **Snippet:** the Argo CD Application YAML.
- **Chips:** `proxmox` `k3s` `argo-cd` `image-updater` `github-actions` `ghcr` `cert-manager`
  `traefik` `tailscale` `cloudflare` `home-assistant` `zigbee`

### 6.3 MTG suite · `mtg` (as in v5, with its screenshots)
Keep the four parts and galleries. Add one line at the top: *All four run on the homelab above.*

### 6.4 Also (compact list under the projects; one line each, with public links)
- **Uren-assistent**: a desktop app that turns a day's activity into booked hours. (public)
- **ux-testing skill**: a Claude Code skill that tests a web app's flows in a real browser and
  fixes what breaks. (public)
- **Scouting agents**: Claude routines that watch Marktplaats, Vinted and Funda and email a
  digest. (private)

## 7. Contact (unchanged)
