# Design brief: ekkelenkamp.dev

> Phase 1: design directions and design system. Nothing is built for production yet. This
> document is the contract every direction in `design/directions/` is judged against.

## 1. Who this is for

**Guus Ekkelenkamp**, security officer, cloud specialist and solution architect at
[Harborn](https://harborn.com) in Rotterdam. By day: deciding how client systems are built,
where they run and who gets in. By night: a homelab that grew into a small platform: an
old laptop with the lid shut running Proxmox, k3s, Argo CD and Home Assistant, plus a handful
of side projects deployed to it.

**The day job and the homelab get equal weight.** The homelab shows the same principles
(zero open ports, everything in git, explicit access) applied for fun, which is what makes the
day-job claims believable.

The site is a business card in a public repo. Two things are on show at once: **the page itself**
and **the source code behind it**. Both have to hold up when someone looks closely.

### Audiences, in order

| # | Who | What they want in 30 seconds | What they want in 5 minutes |
|---|-----|------------------------------|-----------------------------|
| 1 | Developers, tech leads, CTOs (peers, possible employers or collaborators) | Is this person serious? What do they actually own? | Depth: decisions, trade-offs, the gotchas they have hit |
| 2 | Recruiters | Roles (security, cloud, architecture), location, stack, contact | A clear and current story |
| 3 | Friends and the homelab crowd | The fun stuff | The setup, the numbers, a few laughs |

Harborn clients and colleagues are explicitly **not** a target audience: the site isn't a sales
page for the agency. Day-job work is described in terms of responsibilities and approach,
without client case studies.

## 2. What the site has to do

1. **Say who, what and where in one screen.** Name, the three roles, city, one sentence
   with some personality. No hunting for it.
2. **Show depth instead of claiming it.** One project told properly (the homelab) is worth more
   than twelve project cards. Real numbers, real decisions, real mistakes.
3. **Feel fresh and young**, made by a person with taste, without being try-hard.
4. **Be fast, accessible and well made.** The source is public, so it is part of the portfolio.

## 3. The "not AI built" test

AI-generated portfolios in 2025–26 share a recognisable look. Every direction **must avoid**
the following, and the design review checks for each one:

- [ ] Centred hero with "Hi, I'm X 👋" and a gradient blob or aurora behind it
- [ ] Purple/indigo → pink gradients, glassmorphism cards, glowing borders
- [ ] Bento grid of identical rounded cards with an emoji or Lucide icon in each
- [ ] Inter / Poppins / Space Grotesk as the whole typographic identity
- [ ] Copy like "passionate", "crafting digital experiences", "turning ideas into reality"
- [ ] A skill bar or percentage per language ("TypeScript 90%")
- [ ] Generic stock tech words with nothing specific behind them
- [ ] A fake terminal prompt used as decoration (`> whoami`)
- [ ] Everything at the same visual volume: no hierarchy, no surprise, no point of view

What **does** read as human-made:

- **Specifics.** "10 GB for k3s, 3 for Home Assistant, ~2 for the host, 1 to spare" beats
  "scalable infrastructure".
- **A point of view in the layout.** Asymmetry, a strong grid, one idea pushed hard.
- **Typography with character**: variable axes, width, real optical sizes, set deliberately.
- **Things that are slightly wrong on purpose**: a handwritten note, a label stuck on crooked,
  a gotcha admitted openly.
- **Humour that comes from the content**, such as the clogs-hunting bot or the laptop battery
  doing duty as a UPS.

## 4. Tone of voice

Dutch directness, dry and self-aware. Short sentences. Talks like an engineer explaining their
setup at a borrel, not like a LinkedIn post.

| Do | Don't |
|----|-------|
| "It runs on a laptop with the lid shut. The battery is the UPS." | "Leveraging cost-effective edge hardware" |
| "I decide which AI tools are allowed near client data." | "Passionate about security" / "guardian of the cloud" |
| Titles in small print, as facts | Titles as a headline, stacked with slashes and emoji |
| "Learned the hard way, July 2026." | "Overcame challenges" |
| "Git is the source of truth. Claude does the boring part." | "AI-powered workflows" |
| One joke per section, at most | Puns in every heading |

Language: **English** for the site (international audience, `.dev` domain), with Dutch words
used as flavour where they're naturally Dutch (*borrel*, *huisjes*, *gezellig* at most once).

## 5. Constraints

- Static site. Planned build: Astro (Guus uses it already in `huisjes` and `2nd-hand-finds`).
  The design mocks are plain HTML/CSS so they can be reviewed with zero tooling.
- **Hosting:** `ekkelenkamp.dev`, HSTS-preloaded, so HTTPS only. See the hosting note in the
  root README: the zone currently has a tailnet-only wildcard.
- **Performance budget:** see `system/FOUNDATIONS.md` §9.
- **No hardware brands:** the homelab laptop is "an old laptop", never named by brand/model.
- **Privacy:** this is a public repo. No tailnet names, IPs, LAN addresses, hardware serials,
  secret names or internal hostnames ever appear in copy or code. Describe the architecture,
  not the address book.

## 6. Deliverables of this phase

1. `BRIEF.md`: this file
2. `CONTENT.md`: the content inventory and copy deck shared by all directions
3. `system/FOUNDATIONS.md`: the system rules every direction follows (tokens, type, grid,
   motion, a11y, performance)
4. `system/tokens.schema.json` + `system/base.css`: the shared token contract and reset
5. `directions/0N-*/`: five directions, each with:
   - `index.html`: the full homepage, responsive, with **switchable options**
   - `system.html`: that direction's design system sheet (tokens, type specimen, colour with
     contrast ratios, components, motion)
   - `README.md`: rationale, options, risks, what it would take to build
6. `/index.html`: the review hub comparing the directions side by side

## 7. How to pick

Score each direction 1–5 on these five criteria:

1. **Recognisable**: would you remember it tomorrow?
2. **Credible**: does it make the depth of work believable?
3. **Personal**: could it only be Guus's site?
4. **Durable**: will it still feel right in two years, and with ten more projects?
5. **Buildable**: can it ship as a fast static site without heroics?

Mixing is allowed and expected: take the system from one direction and the hero from another.
