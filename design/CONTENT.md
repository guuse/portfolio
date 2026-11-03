# Content & copy (round 2)

Round 1 leaned on concepts and tech in-jokes (datasheets, floor plans, "rover clogs: 0").
Guus's feedback: **it doesn't need to be that tech-savvy or cringy. Just a normal, good
website and portfolio.** This copy deck replaces the round-1 copy (archived in
`archive/round-1/CONTENT.md`).

## Tone

- Plain, friendly, first person. Write it the way you'd explain it to someone at a party who
  asked, "So what do you do?"
- Short sentences, few jargon words. Tech terms only where they're the actual name of the thing
  (Kubernetes, Home Assistant).
- **No jokes as a device.** At most one light line per page, and only if it would also work
  spoken out loud.
- One title: **Tech lead, infra team at Harborn**. Security, cloud and architecture are what
  the work covers, never separate titles.
- Never name the laptop's brand or model. No IPs, hostnames or internal names.

---

## 0. Meta

| Field | Value |
|---|---|
| Page title | Guus Ekkelenkamp |
| Meta description | Tech lead of the infra team at Harborn in Rotterdam. Security, cloud and architecture, plus a few side projects. |
| Contact | `hello@ekkelenkamp.dev` `[CONFIRM]` · GitHub `guuse` · LinkedIn `[CONFIRM url]` |

## 1. Header

`Guus Ekkelenkamp` · nav: **Work · Projects · About · Contact**

## 2. Intro (hero)

**Headline (pick one):**
- A. *I'm Guus. I lead the infra team at Harborn in Rotterdam.*
- B. *Guus Ekkelenkamp. Tech lead, infrastructure, Rotterdam.*

**Intro paragraph:**
> I make sure the platforms our clients run on are secure, reliable and well thought out. At
> home I build things too: a small server setup, some web apps, and more automation than one
> apartment needs.

**Photo:** a portrait of Guus `[TODO photo]`.

## 3. Work

**Heading:** Work

> I'm tech lead of the infra team at Harborn, a digital agency in Rotterdam and Amsterdam.
> Before a client project gets built, we decide where it runs, how it's set up and who gets
> access to what.

Three short columns (heading + one sentence):

- **Security**: Policies people actually follow, access reviews, and deciding which tools are allowed near client data.
- **Cloud & platform**: The Kubernetes platform our projects run on, set up so it can be rebuilt from code.
- **Architecture**: How client systems connect, and writing down why we chose what we chose.

Optional line: *Before Harborn: `[CONFIRM: previous roles/education]`*

## 4. Projects

**Heading:** Projects · **Sub:** *Things I build outside work.*

### Rotation rule (mandatory)

On every page load, **one project is picked at random as the featured project** and shown
big (image, title, short story, link). **The other projects appear in a regular list/grid
below it**, in their normal order, without the featured one. Without JS, the Homelab is
featured. Store nothing; it's a plain random pick per load. The featured slot and the list item
are the same data with two layouts.

### The projects (same fields for each)

**1. Homelab & home automation** · `homelab`
- One-liner: *A small home server that runs my apps and my home automation.*
- Story (featured, 2–3 sentences): *An old laptop under the TV runs everything: my side
  projects, Home Assistant and the lights. It's only reachable through my own private
  network, and every change goes through git, so I can rebuild it in an afternoon. Next up:
  three small second-hand PCs to turn it into a proper cluster.*
- Tags: Proxmox · Kubernetes · Home Assistant · Zigbee
- Image: *PHOTO: the setup under the TV / the wall panel*

**2. Rules of 99** · `rules-of-99`
- One-liner: *Play Commander (Magic: The Gathering) with friends in the browser.*
- Story: *Import a deck, share a room code, and play with up to four people. An open-source
  rules engine handles the rules, so nobody has to argue about them. Works on phones too.*
- Tags: Java · React · TypeScript · WebSockets
- Image: *SCREENSHOT: a 4-player game*

**3. 2nd-hand finds** · `finds`
- One-liner: *A tool that keeps an eye on Marktplaats and Vinted for me.*
- Story: *Every two hours it checks for things I'm looking for, like Magic card collections or
  cheap mini PCs, and uses AI to filter out the noise. The good ones arrive in a short email.*
- Tags: Python · Claude · Astro
- Image: *SCREENSHOT: the finds overview*

**4. Quizmaster** · `quizmaster`
- One-liner: *A live party quiz with questions generated on the spot.*
- Story: *Everyone joins on their phone, pick a theme, and the questions are made up as you
  play. Built for one birthday, used at every party since.* `[CONFIRM the story]`
- Tags: `[CONFIRM stack]`
- Image: *SCREENSHOT: the quiz on a phone*

**5. Scryfall, in plain words** · `scryfall`
- One-liner: *Search Magic cards by describing what you want.*
- Story: *Type "cheap green cards that ramp" and it turns that into a proper Scryfall search,
  checks that it returns results, and sends you there.*
- Tags: Claude · TypeScript `[CONFIRM]`
- Image: *SCREENSHOT: search box + results*

## 5. About

**Heading:** About

> I live in Rotterdam. When I'm not working I'm usually tinkering with something at home,
> playing Magic with friends, or scrolling Marktplaats for things I don't need.
> `[CONFIRM / personalise]`

Small "Tools I use a lot" line (plain text, no logos):
*Kubernetes, Argo CD, Terraform `[CONFIRM]`, Cloudflare, Tailscale, TypeScript, Python, Home Assistant.*

## 6. Contact

**Heading:** Contact

> Want to work together or just say hi? Send me an email.
> **hello@ekkelenkamp.dev** · GitHub · LinkedIn

Footer: *© 2026 Guus Ekkelenkamp*

---

## 7. Project page (one example: the Homelab)

Normal case-study page, readable by non-tech friends **and** interesting for tech people.

- Back link · Title: **Homelab & home automation** · one-liner · tags · year: 2026
- Big image
- **What it is**: the story paragraph, slightly longer
- **Why I built it**: *I wanted one place for my side projects, and to try things at home
  before recommending them at work.*
- **How it works** (plain words, with a simple diagram):
  *The laptop runs two virtual machines. One runs Kubernetes with my apps; the other runs Home
  Assistant with a Zigbee stick for the lights and sensors. Nothing is open to the internet;
  I connect through a private network (Tailscale). When I push code to GitHub, it's built and
  deployed automatically (Argo CD).*
- **A few numbers** (3–4 simple stats): *16 GB memory · 2 virtual machines · 7 of my own apps
  · 0 open ports*
- **What I learned** (3 bullets, plain):
  - *Small mistakes in disk setup add up. Check how much space the installer really gave you.*
  - *Keep a simple way in that works when everything else breaks.*
  - *Writing everything down makes rebuilding boring, which is exactly what you want.*
- **What's next**: *Three small second-hand PCs in a 3D-printed rack.*
- Next project link (picks the next one)
