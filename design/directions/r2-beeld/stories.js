/*
 * r2-beeld · round 15: scrollytelling architecture diagrams.
 *
 * Each story is one SVG drawn on a 900-wide grid. Elements carry data-show="n" and appear once
 * the reader reaches step n (the figure gets classes s1..sn). The baked HTML has every class set,
 * so without JS the final, complete diagram is shown. Icons are <use> references into a sprite
 * that build-artifact.js inlines: official AWS Architecture Icons (aws-icons@3.3.0) and
 * simple-icons@13.21.0 brand marks.
 *
 * Exports: platformSVG(), homelabSVG(), waysSVG(), boxSVG(), sprite(dir)
 */
"use strict";
const fs = require("fs");
const path = require("path");

/* ------------------------------------------------------------------ sprite */
const AWS = ["AmazonElasticKubernetesService", "AmazonAurora", "AmazonElastiCache", "AmazonOpenSearchService", "AmazonEFS",
  "AmazonCloudFront", "AmazonRoute53", "AmazonSimpleStorageService", "AmazonEC2Instance", "AmazonVPCNATGateway",
  "ElasticLoadBalancingNetworkLoadBalancer", "AWSCloudDark", "Region", "VirtualprivatecloudVPC", "Privatesubnet", "Publicsubnet", "AWSCertificateManager"];
const BRAND = ["kubernetes", "argo", "proxmox", "homeassistant", "tailscale", "cloudflare", "github", "githubactions", "pulumi",
  "terraform", "grafana", "docker", "traefikproxy", "letsencrypt", "zigbee", "helm"];
function sprite(dir) {
  const sym = (id, file) => {
    let s = fs.readFileSync(file, "utf8");
    const vb = (s.match(/viewBox="([^"]+)"/) || [])[1] || "0 0 24 24";
    let inner = s.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "").replace(/<title>[\s\S]*?<\/title>/g, "");
    return '<symbol id="' + id + '" viewBox="' + vb + '">' + inner + "</symbol>";
  };
  return '<svg class="sprite" width="0" height="0" aria-hidden="true" style="position:absolute">' +
    AWS.map((n) => sym("aws-" + n, path.join(dir, "assets/icons/aws", n + ".svg"))).join("") +
    BRAND.map((n) => sym("si-" + n, path.join(dir, "assets/icons/brand", n + ".svg"))).join("") + "</svg>";
}

/* ------------------------------------------------------------------ primitives */
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const show = (n) => (n ? ' data-show="' + n + '"' : "");
function use(id, x, y, s, n, cls) { return '<use href="#' + id + '" x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '"' + (cls ? ' class="' + cls + '"' : "") + show(n) + "/>"; }
function text(x, y, s, cls, n, anchor) { return '<text x="' + x + '" y="' + y + '" class="' + (cls || "t") + '"' + (anchor ? ' text-anchor="' + anchor + '"' : "") + show(n) + ">" + esc(s) + "</text>"; }
// An AWS group frame: coloured border, the group icon in the top-left corner, a label beside it.
function frame(x, y, w, h, kind, label, n, extra) {
  return '<g class="fr fr--' + kind + '"' + show(n) + ">" +
    '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>' +
    (extra && extra.icon ? (extra.icon.indexOf("si-") === 0 ? use(extra.icon, x + 6, y + 3, 16) : use(extra.icon, x, y, 22)) : "") +
    text(x + (extra && extra.icon ? 30 : 10), y + 16, label, "fl") + "</g>";
}
// A service: icon tile with its name below (and an optional second line).
function svc(id, x, y, name, n, sub, size) {
  const s = size || 40;
  return "<g" + show(n) + ' class="svc">' + use(id, x, y, s) +
    text(x + s / 2, y + s + 17, name, "t", 0, "middle") + (sub ? text(x + s / 2, y + s + 34, sub, "ts", 0, "middle") : "") + "</g>";
}
function line(d, n, cls) { return '<path class="ln' + (cls ? " " + cls : "") + '" d="' + d + '"' + show(n) + "/>"; }
function wrap(cls, vb, label, body, steps) {
  const all = Array.from({ length: steps }, (_, i) => "s" + (i + 1)).join(" ");
  return '<svg class="story ' + cls + " " + all + '" viewBox="' + vb + '" role="img" aria-label="' + esc(label) + '" data-steps="' + steps + '">' + body + "</svg>";
}

/* ------------------------------------------------------------------ platform */
// States: 1 cloud/region/VPC/AZs · 2 EKS + nodes · 3 data services · 4 traffic in, Karpenter scales out · 5 Tokyo, CloudFront, backups · 6 IPv6 · 7 Azure
function platformSVG() {
  const AZ = [56, 238, 420], azW = 172;
  let b = "";
  b += frame(8, 8, 884, 704, "cloud", "AWS Cloud", 1, { icon: "aws-AWSCloudDark" });
  b += frame(24, 44, 600, 652, "region", "Region · eu-west-1 (Ireland)", 1, { icon: "aws-Region" });
  b += "<g" + show(2) + ' class="svc">' + use("aws-AmazonElasticKubernetesService", 380, 66, 34) + text(422, 82, "EKS", "t") + text(422, 100, "managed control plane", "ts") + "</g>";
  b += frame(40, 136, 568, 544, "vpc", "VPC", 1, { icon: "aws-VirtualprivatecloudVPC" });
  b += '<g class="ipv"' + show(1) + ">" + text(120, 152, "dual-stack: IPv4 + IPv6", "ts v4") + text(120, 152, "IPv6-only, DNS64/NAT64 for IPv4", "ts v6") + "</g>";
  AZ.forEach((x, i) => {
    const az = "eu-west-1" + "abc"[i];
    b += '<g class="fr fr--az"' + show(1) + '><rect x="' + x + '" y="172" width="' + azW + '" height="494"/>' + text(x + azW / 2, 190, "Availability Zone " + az.slice(-1).toUpperCase(), "fl", 0, "middle") + "</g>";
    b += frame(x + 8, 200, azW - 16, 104, "pub", "Public subnet", 1, { icon: "aws-Publicsubnet" });
    b += frame(x + 8, 316, azW - 16, 338, "priv", "Private subnet", 1, { icon: "aws-Privatesubnet" });
    // step 3: an NLB in each public subnet; step 4: NAT gateway (bastion in A)
    b += svc("aws-ElasticLoadBalancingNetworkLoadBalancer", x + 22, 232, "NLB", 4, "", 34);
    b += "<g" + show(3) + ' class="svc">' + use("aws-AmazonVPCNATGateway", x + 104, 232, 34) + '<g class="ipv">' + text(x + 121, 283, "NAT", "t v4", 0, "middle") + text(x + 121, 283, "NAT64", "t v6", 0, "middle") + "</g></g>";
    // step 2: Karpenter nodes, staggered so they appear to scale out
    b += use("aws-AmazonEC2Instance", x + 66, 350, 40, 4, "node node--extra") + '<g class="nodes">' + [0, 1].map((k) => use("aws-AmazonEC2Instance", x + 12 + k * 108, 350, 40, 2, "node node--" + (i * 2 + k))).join("") +
      text(x + azW / 2, 410, "nodes", "ts", 2, "middle") + "</g>";
    // step 3: ingress controller pods on each node set
    b += '<g class="pods"' + show(4) + ">" + use("si-kubernetes", x + 30, 428, 20, 0, "k8s") + use("si-kubernetes", x + 60, 428, 20, 0, "k8s") + use("si-kubernetes", x + 90, 428, 20, 0, "k8s") + use("si-kubernetes", x + 120, 428, 20, 0, "k8s") +
      text(x + azW / 2, 468, "ingress + app pods", "ts", 0, "middle") + "</g>";
  });
  // step 4: data services in the private subnets, EFS mounted in every AZ
  b += svc("aws-AmazonAurora", AZ[0] + 66, 500, "Aurora", 3);
  b += svc("aws-AmazonElastiCache", AZ[1] + 66, 500, "ElastiCache", 3, "Redis");
  b += svc("aws-AmazonOpenSearchService", AZ[2] + 66, 500, "OpenSearch", 3);
  b += '<g' + show(3) + ' class="efs">' + AZ.map((x) => use("aws-AmazonEFS", x + 72, 598, 28)).join("") + text(332, 692, "EFS, mounted in every zone", "ts", 0, "middle") + "</g>";
  b += text(AZ[0] + 121, 296, "+ bastion", "ts", 3, "middle");
  // step 2: Karpenter label
  // step 3: DNS and the way in
  b += svc("aws-AmazonRoute53", 660, 60, "Route 53", 4);
  b += line("M680 122 V164 H600 V250 H584", 4, "ln--in");
  // step 5: CloudFront, Tokyo, backups
  b += svc("aws-AmazonCloudFront", 790, 60, "CloudFront", 5);
  b += frame(640, 240, 244, 196, "region", "Region · ap-northeast-1 (Tokyo)", 5, { icon: "aws-Region" });
  b += svc("aws-AmazonElasticKubernetesService", 742, 290, "EKS", 5, "second cluster");
  b += line("M810 122 V240", 5, "ln--edge");
  b += text(804, 176, "/<region>/*", "tc", 5, "end");
  b += line("M800 122 V214 H624", 5, "ln--edge");
  b += text(712, 208, "default", "tc", 5, "middle");
  b += svc("aws-AmazonSimpleStorageService", 742, 470, "S3", 5, "Velero backups");
  // step 6: IPv6 flip (the labels swap via .s6)
  // step 7: the same platform on Azure
  b += '<g' + show(7) + ' class="fr fr--azure"><rect x="640" y="580" width="244" height="116"/>' + text(652, 600, "Microsoft Azure · AKS", "fl") +
    use("si-pulumi", 660, 618, 28) + text(696, 638, "Pulumi", "t") +
    text(652, 680, "the same platform, adapted for AKS", "ts") + "</g>";
  return wrap("story--platform", "0 0 900 720", "Architecture of the hosting platform on AWS: a VPC in eu-west-1 across three availability zones with public and private subnets; EKS with Karpenter nodes; Route 53 and a Network Load Balancer in front of the ingress controller; Aurora, ElastiCache, OpenSearch and EFS in the private subnets; a second EKS cluster in Tokyo behind CloudFront path behaviours; Velero backups to S3; IPv6-only egress with DNS64 and NAT64; and the same platform, adapted for Azure AKS, delivered through Pulumi.", b, 7);
}

/* ------------------------------------------------------------------ homelab: one change, git push to running */
// Steps: 1 push · 2 Actions builds · 3 image on GHCR · 4 Image Updater commits the tag back · 5 Argo CD syncs · 6 pod running · 7 the loop and paths-ignore
function homelabSVG() {
  let b = "";
  b += frame(16, 24, 300, 552, "gh", "GitHub", 1, { icon: "si-github" });
  b += frame(380, 24, 504, 552, "box", "The laptop · Proxmox", 1, { icon: "si-proxmox" });
  b += frame(400, 72, 464, 380, "vm", "VM · Ubuntu + k3s", 1, { icon: "si-kubernetes" });
  const node = (id, x, y, name, sub, n) => "<g" + show(n) + ' class="hn">' + '<rect x="' + x + '" y="' + y + '" width="236" height="72" rx="4"/>' + use(id, x + 16, y + 18, 36, 0, "mono") +
    text(x + 66, y + 32, name, "t") + text(x + 66, y + 54, sub, "ts") + "</g>";
  b += node("si-github", 48, 72, "App repo", "main + deploy/", 1);
  b += node("si-githubactions", 48, 236, "GitHub Actions", "build and test", 2);
  b += node("si-docker", 48, 400, "GHCR", "tagged with the SHA", 3);
  b += node("si-argo", 420, 116, "Image Updater", "watches GHCR", 4);
  b += node("si-argo", 420, 236, "Argo CD", "syncs from git", 5);
  b += node("si-kubernetes", 420, 356, "app pod", "running the new image", 6);
  // edges, each the move of one step
  b += line("M166 144 V236", 2, "e e2");
  b += line("M166 308 V400", 3, "e e3");
  b += line("M284 436 H332 V160 H420", 4, "e e4a");
  b += line("M420 136 H352 V108 H284", 4, "e e4b");
  b += line("M284 92 H372 V272 H420", 5, "e e5");
  b += line("M538 308 V356", 6, "e e6");
  b += text(100, 520, "Push to main and it rolls out", "ts", 1);
  // step 7: the loop. The tag commit lands in the same repo, CI builds again…
  b += '<g class="loop"' + show(7) + ">" + '<path class="loopring" d="M140 196 a 26 26 0 1 1 0.1 0"/>' +
    '<path class="cut" d="M120 170 L190 222"/>' + text(206, 192, "paths-ignore:", "tc") + text(206, 212, "deploy/**", "tc") + "</g>";
  b += '<g' + show(1) + ">" + use("si-tailscale", 420, 486, 24, 0, "mono") + text(452, 503, "reached over my tailnet; no open ports", "ts") + "</g>";
  return wrap("story--homelab", "0 0 900 600", "One change travelling from git push to running: the app repo on GitHub, a GitHub Actions build, an image on GHCR tagged with the commit SHA, Argo CD Image Updater committing the new tag back to the repo, Argo CD syncing, and the pod running in k3s on the laptop. Because the tag commit lands in the same repo, CI would build again in a loop; paths-ignore on deploy/ cuts it.", b, 7);
}

/* ------------------------------------------------------------------ homelab: ways in, inside the box */
function waysSVG() {
  let b = "";
  const row = (y, icon, who, via, note, cls) => '<g class="way ' + cls + '">' + text(16, y + 24, who, "t") + '<path class="ln" d="M150 ' + (y + 18) + ' H290 M520 ' + (y + 18) + ' H560"/>' +
    use(icon, 300, y, 36, 0, "mono") + text(346, y + 16, via, "t") + text(346, y + 36, note, "ts") + "</g>";
  b += row(20, "si-tailscale", "My devices", "Tailscale", "the default", "w1");
  b += row(110, "si-cloudflare", "A visitor", "Cloudflare Tunnel", "+ Access, opt-in", "w2");
  b += row(200, "si-tailscale", "A party guest", "Tailscale Funnel", "opt-in, for one evening", "w3");
  b += '<rect class="hn-r" x="560" y="16" width="200" height="226" rx="4"/>' + use("si-traefikproxy", 580, 36, 36, 0, "mono") + text(626, 52, "Traefik", "t") + text(626, 72, "one wildcard cert", "ts") +
    use("si-letsencrypt", 580, 106, 30, 0, "mono") + text(620, 126, "Let's Encrypt", "ts") + text(580, 190, "0 open ports", "tb");
  return '<svg class="story story--ways" viewBox="0 0 780 260" role="img" aria-label="Three ways in: my devices over Tailscale by default; a visitor through a Cloudflare Tunnel with Access, opt-in; a party guest through Tailscale Funnel, opt-in. All end at Traefik with one wildcard Let\'s Encrypt certificate. No open ports.">' + b + "</svg>";
}

/* ------------------------------------------------------------------ platform: the two delivery lanes (secondary) */
function pipelineSVG() {
  const lane = (y, items, label) => {
    let g = text(16, y - 30, label, "fl") + '<path class="ln" d="M40 ' + y + ' H' + (40 + (items.length - 1) * 168) + '"/>';
    items.forEach((it, i) => {
      const x = 40 + i * 168;
      g += '<circle cx="' + x + '" cy="' + y + '" r="6" class="pdot"/>' + (it[1] ? use(it[1], x - 14, y - 26 - 22, 24, 0, "mono") : "") +
        text(x, y + 28, it[0], "t", 0, "middle") + (it[2] ? text(x, y + 48, it[2], "ts", 0, "middle") : "");
    });
    return g + '<circle class="ptoken" cx="40" cy="' + y + '" r="7" style="--len:' + (items.length - 1) * 168 + 'px"/>';
  };
  const b = lane(80, [["Pull request", "si-github"], ["Preview", "si-pulumi", "+ CrossGuard"], ["Saved plan"], ["Approved", "", "not by the author"], ["Apply", "", "AWS and Azure"]], "Infrastructure") +
    lane(220, [["CI", "si-githubactions"], ["Registry", "si-docker"], ["Image Updater", "si-argo", "watches"], ["Commit to git", "si-github"], ["Argo CD", "si-argo", "acceptance, then production"]], "Apps");
  return '<svg class="story story--pipe" viewBox="0 0 760 290" role="img" aria-label="Two delivery lanes. Infrastructure: pull request, Pulumi preview with the CrossGuard policy pack, saved plan, approval by someone other than the author, apply to AWS and Azure. Apps: CI, registry, Argo CD Image Updater watching it, commit to git, Argo CD syncing acceptance and then production.">' + b + "</svg>";
}

/* ------------------------------------------------------------------ homelab: app-of-apps */
function appsSVG() {
  let b = '<rect class="hn-r" x="300" y="10" width="200" height="56" rx="4"/>' + use("si-argo", 316, 22, 32, 0, "mono") + text(358, 44, "root application", "t");
  for (let i = 0; i < 15; i++) {
    const c = i % 5, r = Math.floor(i / 5), x = 40 + c * 148, y = 110 + r * 64;
    b += '<g class="tile" style="--i:' + i + '"><path class="ln" d="M400 66 V88 H' + (x + 60) + " V" + y + '"/><rect class="hn-r" x="' + x + '" y="' + y + '" width="120" height="44" rx="4"/>' +
      (i === 0 ? use("si-argo", x + 10, y + 10, 24, 0, "mono") + text(x + 42, y + 28, "Argo CD", "ts") : '<rect class="tile__bar" x="' + (x + 14) + '" y="' + (y + 18) + '" width="' + (50 + (i * 23) % 40) + '" height="8" rx="2"/>') + "</g>";
  }
  return '<svg class="story story--apps" viewBox="0 0 800 300" role="img" aria-label="One root Argo CD application with fifteen child applications beneath it, one of them Argo CD itself.">' + b + "</svg>";
}

/* ------------------------------------------------------------------ MTG: the screens stack */
function mtgStack(img) {
  // img(id) returns an <img> tag; layers appear per step.
  const L = [["r99-lobby", 1], ["r99-game-combat", 2], ["tutor-library", 3], ["scryfall-home", 4], ["mtg-skills-banner", 5]];
  return '<div class="mstack s1 s2 s3 s4 s5" data-steps="5">' + L.map((l, i) => '<figure class="mstack__l mstack__l--' + i + '" data-show="' + l[1] + '">' + img(l[0]) + "</figure>").join("") +
    '<figure class="mstack__phone" data-show="4">' + img("scryfall-home-mobile") + "</figure></div>";
}

module.exports = { platformSVG, homelabSVG, waysSVG, pipelineSVG, appsSVG, mtgStack, sprite };
