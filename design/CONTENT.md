# Content inventory & copy deck

Every direction uses **this copy**. Directions may shorten or restructure it, but must not
invent facts. Items marked `[CONFIRM]` are assumptions Guus needs to check before launch.

Facts are taken from Guus's own repos (homeserver, rules-of-99, 2nd-hand-finds, huisjes and
the Argo CD application manifests), as of November 2026. **Public-safe:** no IPs, tailnet names,
LAN addresses, device IDs or internal hostnames.

---

## 0. Meta

| Field | Value |
|---|---|
| Name | Guus Ekkelenkamp |
| Handle | `guuse` (GitHub) |
| Domain | ekkelenkamp.dev |
| City | Rotterdam, NL |
| Role | Developer at Harborn `[CONFIRM exact title]` |
| Contact | `hello@ekkelenkamp.dev` `[CONFIRM: mailbox doesn't exist yet]` · github.com/guuse · LinkedIn `[CONFIRM url]` |
| Page title | Guus Ekkelenkamp, developer, Rotterdam |
| Meta description | Developer at Harborn in Rotterdam. Builds web platforms by day and a GitOps homelab on a lid-shut laptop by night. |

---

## 1. Hero

**Name:** Guus Ekkelenkamp

**One-liner options** (directions pick one, or rotate them):

- A. *I build software for clients by day and a homelab by night. The homelab has better uptime.*
- B. *Developer in Rotterdam. Runs fifteen services on a laptop with the lid shut.*
- C. *Web developer, part-time sysadmin, full-time "I'll just automate that".*

**Sub-line:** Developer at Harborn, Rotterdam. Product work, platforms, and the plumbing in between.

**Status chip:** `Currently: moving my infra to ekkelenkamp.dev & hunting mini PCs for node #2`

---

## 2. Now *(a short "now page" block)*

- Building a **3-node homelab** out of ex-office 1-litre mini PCs (€50–100 each) for a
  3D-printed rack. A bot I wrote scouts Marktplaats for them every two hours.
- Shipping **Rules of 99** 2.0: Commander in the browser, now on phones too.
- Moving everything from `guuse.online` to `ekkelenkamp.dev`.
- Searching for a first home. Yes, there's a repo for that too.

---

## 3. Work (day job)

**Harborn**: digital agency in Rotterdam & Amsterdam, part of Boer & Croon.

> I work on the stuff clients actually run: web platforms, customer portals, product
> configurators, integrations with ERP and data systems, and the occasional Flutter app. I also
> work on the layer underneath: GitOps, Kubernetes, and the internal AI-agent tooling we use to
> ship faster. `[CONFIRM scope + since when]`

Clients I've worked for (public Harborn cases): a client, a client, a client.
`[CONFIRM: OK to name? Otherwise use "industrial manufacturers, a bike brand, a logistics company"]`

What that looks like in practice:

- **Product**: Astro, React/TypeScript, Flutter, Rails, PHP, Python/FastAPI `[CONFIRM list]`
- **Platform**: Kubernetes (Haven), Argo CD, GitHub Actions, Docker base images
- **AI tooling**: Claude-based agents, skills and plugins for the team's daily work

---

## 4. Featured project: The homelab ⟵ the centrepiece

**Title:** *A data centre with the lid shut*
**Kicker:** Homelab · Home automation · GitOps · 2026–ongoing

### 4.1 Intro

> One second-hand laptop, lid closed, behind the TV. It runs a hypervisor, a Kubernetes
> cluster, Home Assistant with a Zigbee radio, and every side project I've shipped this year.
> Nothing on it is reachable from the internet unless I explicitly say so. Every change goes
> through git.

### 4.2 Spec sheet (numbers are real)

| Spec | Value |
|---|---|
| Hardware | old laptop · Intel laptop CPU (4c/8t) · 16 GB · ~512 GB SSD |
| UPS | The laptop battery |
| Hypervisor | Proxmox VE 9.2 (Debian 13 "Trixie") |
| VM 100 | `k3s-01`: Ubuntu 26.04, 4 vCPU, 10 GB RAM, 360 GiB thin disk, single-node k3s |
| VM 101 | `haos-01`: Home Assistant OS, 2 vCPU, 3 GB RAM, Zigbee stick passed through |
| Network | Tailscale only. Zero open ports on the router |
| TLS | Wildcard Let's Encrypt via Cloudflare DNS-01 → Traefik default TLSStore |
| GitOps | Argo CD app-of-apps, self-managed root, 16 Application manifests |
| Apps deployed | 7 of my own + 8 platform components |
| Deploy flow | push → GitHub Actions builds `ghcr.io/…:<sha>` → Image Updater commits the tag → Argo syncs |
| Backups | VM snapshots. No RAID, no off-box backup, *by choice* |

### 4.3 The RAM budget *(great visual moment)*

```
16 GB total
├─ 10 GB  k3s-01     (real use 2–4 GB; Argo CD is the only heavyweight)
├─  3 GB  haos-01    (Home Assistant + ZHA)
├─ ~2 GB  Proxmox host
└─ ~1 GB  cushion    (10 + 4 would have tipped into OOM territory)
```

### 4.4 Architecture (layers, for a diagram)

```
old laptop (bare metal, lid shut, battery = UPS)
└─ Proxmox VE 9.2 ── Tailscale (mgmt), firewall: tailnet-only
   ├─ VM k3s-01 ── k3s
   │   ├─ Traefik + wildcard TLS (cert-manager, DNS-01)
   │   ├─ Argo CD ◀── github.com/guuse/homeserver (app-of-apps)
   │   │   └─ Image Updater ◀── GHCR commit-SHA tags
   │   ├─ Headlamp (cluster dashboard)
   │   ├─ Tailscale operator → Funnel (public, opt-in per app)
   │   ├─ cloudflared → Cloudflare Tunnel + Access (public, opt-in per app)
   │   └─ apps: rules-of-99 · quizmaster · grimoire · scryfall · 2nd-hand-finds · huisjes · home-dashboard
   └─ VM haos-01 ── Home Assistant OS
       ├─ Zigbee coordinator (USB passthrough, on a USB2 extension cable)
       ├─ NGINX SSL proxy (TLS) → HA Core on plain HTTP (LAN fallback)
       └─ Tailscale add-on
```

**Three ways in, all opt-in:**

1. **Tailnet** (default): `*.domain` → Tailscale IP, valid public cert, only my devices.
2. **Cloudflare Tunnel**: a friendly public hostname with Cloudflare Access in front, no inbound port.
3. **Tailscale Funnel**: public `*.ts.net` URL for things like the quiz game at a party.

### 4.5 Decisions (short, punchy, each one a card/row)

1. **k3s in a VM, not LXC.** Kubernetes in a container needs privileged mode and cgroup
   hacks, and breaks on upgrades. A VM snapshots as one unit.
2. **Home Assistant next to the cluster, not in it.** USB passthrough to a VM is one line.
   Into a pod it means a device plugin and node pinning, and it breaks on reschedule.
3. **TLS at the proxy, plain HTTP in HA Core.** So there's always a LAN fallback that works with
   no cert, no tailnet, no proxy.
4. **One flat `applications/` folder.** The root app manages itself. No
   bootstrap/projects/apps sprawl.
5. **No backups beyond snapshots.** A conscious trade-off: everything is rebuildable from git,
   and the guide is good enough to do it in an afternoon.

### 4.6 Gotchas: "learned the hard way"

- **Disk-pressure at 30 GiB on a 500 GB SSD.** Ubuntu's guided LVM install allocated half the
  disk and parked the rest as free space. Kubelet panicked. Fix: one `lvextend`, zero downtime.
- **`lvextend` on the host does nothing for the guest.** QEMU never hears about it. Resize
  through Proxmox or `qm resize`. *July 2026.*
- **Public DNS broke on every Linux node.** MagicDNS had no global nameserver, so `*.ts.net`
  resolved and nothing else did. My Mac kept working because macOS ignores `resolv.conf`.
- **Home Assistant doesn't renew its own certs.** A monthly automation restarts the Let's
  Encrypt add-on, then NGINX. HA Core itself never restarts.
- **The Zigbee mesh survived the Pi → VM move with zero re-pairing.** Same stick, full backup,
  "Restore backup" on the scary ZHA dialog, *never* "keep new settings".

### 4.7 Home automation, the human side `[CONFIRM: add real automations/devices]`

> The Zigbee network used to live on a Raspberry Pi. Now it lives in a VM with the radio on an
> extension cable, because USB3 ports scream at 2.4 GHz. A wall panel shows what the house is
> doing, and the companion app (`home-dashboard`: Go, embedded React, SQLite) keeps the build
> guides and the parts inventory.

Placeholder automations for the design (replace with real ones):
`Hallway lights at 20% after sunset` · `Washing machine done → phone ping` ·
`Everything off when the last phone leaves` · `Monthly cert renewal (yes, really)`

### 4.8 What's next

Three ex-office mini PCs (laptop Tiny / Dell Micro / HP Mini, 8th gen+, ~16 GB) in a
3D-printed rack, turning the single node into a real cluster. The laptop retires to backup duty.

---

## 5. Side projects

Order = priority. Each has: name · one-liner · 2–3 detail bullets · stack · status · link.

### 5.1 Rules of 99
*Commander in the browser, with full rules enforcement.*
- Wraps **Forge's** open-source Java rules engine headless behind a WebSocket/JSON gateway.
  All ~33k cards are data, and commander tax and 21 commander damage are engine-native.
- **Per-viewer state redaction**: opponents' hands never cross the wire. Rooms via 6-char codes,
  2–4 seats, reconnect-safe seat tokens, host migration.
- Six table layouts on desktop. Below 1280px it turns into a phone shell. Installable as a PWA.
  The card database syncs itself every night.
- Stack: Java 17 · Maven · React · TypeScript · SQLite · WebSockets
- Status: live, 2.0 `[CONFIRM public URL]`

### 5.2 2nd-hand-finds
*A bot that reads Marktplaats so I don't have to.*
- Every two hours (08:00–23:00) it searches Marktplaats and Vinted, applies hard filters,
  then has **Claude judge each listing** against a per-category rubric.
- Hunting: bulk Magic: The Gathering lots (priced via Scryfall), mini PCs for the homelab rack,
  and **one pair of brown New Balance Rover clogs, EU 40, max €180 all-in.**
- Email digest, price-drop alerts, a "something broke" alarm, and a small UI to mark finds
  loved / hidden / bought. 280+ finds recorded so far.
- Stack: Python · Claude · Astro SSR · Resend · k3s

### 5.3 Quizmaster
*A live multiplayer quiz where the questions are generated on the spot.*
- Party game, made public for the evening through Tailscale Funnel.
- Stack: `[CONFIRM]`

### 5.4 Scryfall, in plain words
*Ask for cards like a human. Get a real Scryfall query back.*
- Claude turns "cheap green ramp that isn't a land" into Scryfall syntax, verifies the query
  actually returns results, and links you to Scryfall.

### 5.5 Grimoire
*An MTG deck-builder I run for myself and my playgroup.*
- Fork, self-hosted, single pod + PVC, deployed via the same Image Updater flow.

### 5.6 huisjes *(optional, personal)*
*Our search for a first home, run like a software project.*
- The git repo is the source of truth: one folder per house, ADRs for decisions, a Funda
  routine that scores new listings against our criteria and emails a digest.
- A read-only web app so my (non-technical) partner sees everything without touching git.

---

## 6. How I work *(principles, 3–5 items)*

1. **Write it down where the code lives.** Every repo of mine has a context file and ADRs. Future
   me and the AI agents both start by reading.
2. **Git is the source of truth.** For infrastructure, for side projects, even for house hunting.
3. **Boring tech, sharp edges filed off.** k3s, Postgres-or-SQLite, Astro. The interesting part
   is the problem.
4. **Automate the second time.** Not the first, not the third.
5. **Let Claude do the boring part.** Judging 200 listings, writing the tag bump, drafting the
   runbook. I review.

---

## 7. Toolbox *(no skill bars, ever)*

Grouped plainly:

- **Daily:** TypeScript, React, Astro, Python, Git, Claude Code
- **Often:** Java, Flutter/Dart, Rails, PHP, FastAPI, SQLite, Postgres `[CONFIRM]`
- **Platform:** Kubernetes (k3s, Haven), Argo CD, Helm, Kustomize, Traefik, cert-manager,
  GitHub Actions, GHCR, Docker
- **Home:** Proxmox, Tailscale, Cloudflare (DNS, Tunnel, Access), Home Assistant, Zigbee (ZHA)

---

## 8. Contact / footer

> **Say hoi.** `hello@ekkelenkamp.dev`
> Code on GitHub: `@guuse`. This site is open source, so poke around.

Footer microcopy options:
- *Built with Astro. Hosted somewhere more reliable than my laptop.*
- *Last deploy: {sha} · {date}* (real values at build time)
- *© 2026 Guus Ekkelenkamp · No cookies, no trackers, no newsletter.*

---

## 9. Data snippets directions may visualise

```json
{
  "ram_gb": { "total": 16, "k3s": 10, "haos": 3, "host": 2, "cushion": 1 },
  "vms": [
    { "id": 100, "name": "k3s-01", "os": "Ubuntu 26.04", "vcpu": 4, "ram_gb": 10, "disk_gib": 360 },
    { "id": 101, "name": "haos-01", "os": "Home Assistant OS", "vcpu": 2, "ram_gb": 3, "disk_gib": 32 }
  ],
  "argo_apps": {
    "platform": ["argocd", "argocd-image-updater", "cert-manager", "cluster-config", "headlamp", "tailscale-operator", "cloudflared", "root"],
    "mine": ["rules-of-99", "quizmaster", "grimoire", "nl-scryfall-se", "2nd-hand-finds", "huisjes", "home-dashboard"]
  },
  "finds_recorded": { "mtg": 253, "homeserver": 30, "rover_clogs": 0 },
  "finder_schedule": "every 2h, 08:00–23:00",
  "rules_of_99": { "cards": 33000, "seats": "2–4", "room_code_len": 6, "mobile_breakpoint_px": 1280 }
}
```

> `rover_clogs: 0` is the funniest number on the site. Use it.
