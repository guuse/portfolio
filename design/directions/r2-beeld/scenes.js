/*
 * r2-beeld · round 16: motion for the illustrated scenes (art.js draws them).
 *
 * The baked SVG is each scene's final frame, which is what no-JS and reduced-motion visitors
 * see. Here, each scene gets an animator: update(p, dt, t), where p (0..1) is scroll progress
 * and t is time, for things that keep moving (packets, LEDs). Only transform and opacity change.
 * One rAF loop runs while at least one scene or card is on screen, and stops when none is.
 *
 * Layout: on wide screens the figures move into one sticky stage and cross-fade as the steps
 * scroll past; on narrow screens each figure stays above its own step and plays as it scrolls
 * through the viewport. Homepage cards loop on time, a little faster on hover.
 */
(function () {
  "use strict";
  if (!window.matchMedia || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!("IntersectionObserver" in window) || !window.requestAnimationFrame) return;
  var NS = "http://www.w3.org/2000/svg";

  /* ---------------------------------------------------------------- easing */
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };
  var E = {
    outCubic: function (t) { return 1 - Math.pow(1 - t, 3); },
    inCubic: function (t) { return t * t * t; },
    inOutCubic: function (t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    outBack: function (t, s) { s = s || 1.70158; var c = s + 1; return 1 + c * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); },
    inOutBack: function (t) { var c = 1.70158 * 1.525; return t < 0.5 ? (Math.pow(2 * t, 2) * ((c + 1) * 2 * t - c)) / 2 : (Math.pow(2 * t - 2, 2) * ((c + 1) * (t * 2 - 2) + c) + 2) / 2; },
    outQuad: function (t) { return 1 - (1 - t) * (1 - t); }
  };

  /* ---------------------------------------------------------------- DOM helpers */
  function keys(svg) {
    var m = {};
    Array.prototype.forEach.call(svg.querySelectorAll("[data-k]"), function (el) { m[el.getAttribute("data-k")] = el; });
    return m;
  }
  // transform: translate, then rotate, then scale (x, y separately)
  function T(el, x, y, sx, sy, r) {
    if (!el) return;
    var s = "translate(" + (x || 0).toFixed(2) + "px," + (y || 0).toFixed(2) + "px)";
    if (r) s += " rotate(" + r.toFixed(2) + "deg)";
    if (sx !== undefined && sx !== null) s += " scale(" + sx.toFixed(3) + "," + (sy === undefined || sy === null ? sx : sy).toFixed(3) + ")";
    if (el.__t !== s) { el.style.transform = s; el.__t = s; }
  }
  function O(el, o) { if (!el) return; var v = o.toFixed(3); if (el.__o !== v) { el.style.opacity = v; el.__o = v; } }
  function hideStill(svg) { Array.prototype.forEach.call(svg.querySelectorAll(".pk-still"), function (n) { n.style.display = "none"; }); }
  function mkPath(svg, parent, d) {
    var p = document.createElementNS(NS, "path");
    p.setAttribute("d", d); p.setAttribute("fill", "none"); p.setAttribute("stroke", "none");
    (parent || svg).appendChild(p);
    return p;
  }

  // Blink a few activity LEDs at random, so the machines look switched on.
  function leds(svg) {
    var list = Array.prototype.slice.call(svg.querySelectorAll(".k-led--act")).filter(function (l) { return !l.hasAttribute("data-k"); });
    list = list.filter(function (_, i) { return i % 2 === 0; }).slice(0, 10);
    var next = list.map(function () { return Math.random() * 2; });
    return function (dt) {
      for (var i = 0; i < list.length; i++) {
        next[i] -= dt;
        if (next[i] <= 0) {
          var on = !list[i].classList.contains("is-blink");
          list[i].classList.toggle("is-blink", on);
          next[i] = on ? 0.06 + Math.random() * 0.12 : 0.3 + Math.random() * 2.2;
        }
      }
    };
  }

  /* ---------------------------------------------------------------- packets */
  // A packet follows a list of path segments at a steady speed (linear on purpose: packets
  // move at line rate). A segment can be hidden (inside a device). An optional stop() gives
  // the distance along the current segment where the packet has to wait.
  function Packets(svg, layer) {
    var live = [], pool = [];
    function make(cls) {
      var g = pool.pop();
      if (!g) {
        g = document.createElementNS(NS, "g");
        g.innerHTML = '<rect x="-8" y="-4.5" width="16" height="9" rx="2" class="pk-b"/><rect x="3" y="-4.5" width="5" height="9" rx="1.5" class="pk-h"/><path d="M-4.5 -1.2H0.5M-4.5 1.4H-1" class="pk-s"/>';
      }
      g.setAttribute("class", "pk " + (cls || ""));
      g.style.opacity = "0";
      layer.appendChild(g);
      return g;
    }
    function spawn(segs, o) {
      o = o || {};
      segs.forEach(function (s) { if (!s.len) s.len = s.el.getTotalLength(); });
      var k = { segs: segs, i: 0, d: 0, v: o.speed || 200, g: make(segs[0].cls), cls: segs[0].cls, stop: o.stop, end: o.end, age: 0, ph: Math.random() * 6, wait: 0 };
      live.push(k);
      return k;
    }
    function update(dt, t) {
      for (var j = live.length - 1; j >= 0; j--) {
        var k = live[j], s = k.segs[k.i];
        k.age += dt;
        var lim = k.stop ? k.stop(k) : Infinity;
        var nd = k.d + k.v * dt;
        if (nd > lim) { nd = Math.max(k.d, lim); k.wait += dt; } else k.wait = 0;
        k.d = nd;
        if (k.d >= s.len) {
          k.d -= s.len; k.i++;
          if (k.i >= k.segs.length) { if (k.end) k.end(k); layer.removeChild(k.g); pool.push(k.g); live.splice(j, 1); continue; }
          s = k.segs[k.i];
          if (s.cls !== undefined && s.cls !== k.cls) { k.g.setAttribute("class", "pk " + s.cls); k.cls = s.cls; }
        }
        var a = s.el.getPointAtLength(k.d), b = s.el.getPointAtLength(Math.min(s.len, k.d + 1.5));
        var ang = Math.atan2(b.y - a.y, b.x - a.x) * 57.2958;
        if (k.d + 1.5 > s.len && k.d > 1.5) { var c = s.el.getPointAtLength(k.d - 1.5); ang = Math.atan2(a.y - c.y, a.x - c.x) * 57.2958; }
        var jx = 0;
        if (k.wait > 0.25) jx = Math.sin(t * 22 + k.ph) * 1.3; // waiting: it keeps retrying
        var fadeIn = clamp(k.age / 0.18, 0, 1), fadeOut = k.i === k.segs.length - 1 ? clamp((s.len - k.d) / 14, 0, 1) : 1;
        k.g.setAttribute("transform", "translate(" + (a.x + jx * Math.cos(ang / 57.2958)).toFixed(2) + " " + (a.y + jx * Math.sin(ang / 57.2958)).toFixed(2) + ") rotate(" + ang.toFixed(1) + ")");
        O(k.g, s.hide ? 0 : fadeIn * fadeOut * (k.fade === undefined ? 1 : k.fade));
      }
    }
    function clear() { live.forEach(function (k) { layer.removeChild(k.g); pool.push(k.g); }); live.length = 0; }
    return { spawn: spawn, update: update, live: live, clear: clear };
  }
  // Spawns at a varying interval around a mean rate (per second); never perfectly regular.
  function Emitter() {
    var acc = 0, gap = 0.3;
    return function (dt, rate, fire) {
      if (rate <= 0) return;
      acc += dt;
      while (acc >= gap) { acc -= gap; fire(); gap = (0.45 + Math.random() * 1.1) / rate; }
    };
  }
  // A packet placed by scroll progress, for scenes that tell one change's journey.
  function Courier(svg, layer) {
    var g = document.createElementNS(NS, "g");
    g.innerHTML = '<rect x="-8" y="-4.5" width="16" height="9" rx="2" class="pk-b"/><rect x="3" y="-4.5" width="5" height="9" rx="1.5" class="pk-h"/><path d="M-4.5 -1.2H0.5M-4.5 1.4H-1" class="pk-s"/>';
    g.style.opacity = "0"; layer.appendChild(g);
    var cls = null;
    return function (el, f, c, o) {
      if (!el) { O(g, 0); return; }
      if (cls !== c) { g.setAttribute("class", "pk " + (c || "")); cls = c; }
      var L = el.__len || (el.__len = el.getTotalLength());
      var a = el.getPointAtLength(clamp(f, 0, 1) * L), b = el.getPointAtLength(Math.min(L, clamp(f, 0, 1) * L + 1.5));
      var ang = Math.atan2(b.y - a.y, b.x - a.x) * 57.2958;
      if (f >= 0.999) { var q = el.getPointAtLength(L - 1.5); ang = Math.atan2(a.y - q.y, a.x - q.x) * 57.2958; }
      g.setAttribute("transform", "translate(" + a.x.toFixed(2) + " " + a.y.toFixed(2) + ") rotate(" + ang.toFixed(1) + ")");
      O(g, o === undefined ? 1 : o);
    };
  }

  /* ================================================================ scenes */
  var SCENES = {};

  /* 1. Many projects, one platform ------------------------------------ */
  SCENES.standard = function (svg) {
    var K = keys(svg), blink = leds(svg);
    var docks = [92, 196, 300, 404, 508], dockY = 222;
    var old = [{ cx: 92, y: 196, r: -3 }, { cx: 222, y: 232, r: 2 }, { cx: 350, y: 262, r: 3.5 }, { cx: 482, y: 232, r: -2 }];
    return function (p, dt) {
      blink(dt);
      for (var i = 0; i < 4; i++) {
        // the old servers sink away first
        var s = seg(p, 0.16 + i * 0.035, 0.28 + i * 0.035);
        T(K["old" + i], 0, 34 * E.inCubic(s)); O(K["old" + i], 1 - E.outQuad(s));
        // each app lifts off to one shared hover line (a small dip first), then drops into its dock
        var dx = old[i].cx - docks[i], dy = old[i].y - dockY, hover = -34;
        var lift = E.inOutBack(seg(p, 0.08 + i * 0.03, 0.26 + i * 0.03));
        var m = seg(p, 0.5 + i * 0.06, 0.68 + i * 0.06), mx = E.inOutCubic(m);
        var x = lerp(dx, 0, mx);
        var y = m > 0 ? lerp(hover, 0, E.outBack(m, 1.5)) - 10 * Math.sin(Math.PI * mx) : lerp(dy, hover, lift);
        var r = lerp(old[i].r, 0, E.inOutCubic(seg(p, 0.2 + i * 0.03, 0.4 + i * 0.03))) + (m > 0 && m < 1 ? Math.sin(m * Math.PI) * 3 * (dx > 0 ? -1 : 1) : 0);
        T(K["win" + i], x, y, null, null, r);
      }
      var m4 = seg(p, 0.8, 0.97);
      T(K.win4, lerp(240, 0, E.outCubic(m4)), lerp(-34, 0, E.outBack(seg(m4, 0.45, 1), 1.5)) - 8 * Math.sin(Math.PI * m4), null, null, (1 - E.outCubic(m4)) * 5);
      O(K.win4, seg(p, 0.79, 0.85));
      var pl = seg(p, 0.36, 0.56);
      T(K.plat, 0, 120 * (1 - E.outBack(pl, 1.05))); O(K.plat, seg(p, 0.36, 0.41));
      for (var d = 0; d < 5; d++) {
        var ds = seg(p, 0.48 + d * 0.04, 0.58 + d * 0.04);
        T(K["dock" + d], 0, 0, 1, Math.max(0.001, E.outBack(ds, 2))); O(K["dock" + d], Math.min(1, ds * 4));
      }
    };
  };

  /* 2. It scales with the load ------------------------------------------ */
  // Each zone: up to four nodes of four pods. When pods don't fit, one waits above the rack
  // (pending) until a node is added; when the load drops, pods drain from the top node and
  // the empty node is removed. Pods fill and drain one at a time.
  function scaler(svg, load) {
    var K = keys(svg), blink = leds(svg);
    hideStill(svg);
    var P = Packets(svg, K.pk), emit = Emitter();
    var ins = [K.in0, K.in1, K.in2], outs = [K.out0, K.out1, K.out2];
    var bias = [1.1, 1.3, 0.85];
    var Z = [0, 1, 2].map(function (z) {
      var nodes = [], pods = [];
      for (var k = 0; k < 4; k++) {
        nodes.push({ el: K["n" + z + k], st: "off", t: 9, idle: 0 });
        for (var s = 0; s < 4; s++) pods.push({ el: K["p" + z + k + s], on: false, t: 9, ack: 9 });
      }
      return { nodes: nodes, pods: pods, cool: 0, pend: K["pend" + z], pendA: 0, want: 1 };
    });
    var first = true;
    function target(z, L) { return clamp(Math.round(1 + L * 11.5 * bias[z]), 1, 16); }
    function ready(z) { var n = 0; z.nodes.forEach(function (x) { if (x.st === "on") n++; }); return n; }
    function placed(z) { var n = 0; z.pods.forEach(function (x) { if (x.on) n++; }); return n; }
    function stepZone(z, zi, dt) {
      z.cool -= dt;
      var P0 = placed(z), R = ready(z), want = z.want;
      if (z.cool <= 0) {
        if (P0 < want) {
          if (P0 < R * 4) {
            for (var i = 0; i < 16; i++) { var pd = z.pods[i]; if (!pd.on && z.nodes[i >> 2].st === "on") { pd.on = true; pd.t = 0; break; } }
            z.cool = 0.07 + Math.random() * 0.08;
          } else {
            var coming = z.nodes.some(function (x) { return x.st === "in"; });
            if (!coming) for (var k = 0; k < 4; k++) if (z.nodes[k].st === "off") { z.nodes[k].st = "in"; z.nodes[k].t = 0; break; }
            z.cool = 0.1;
          }
        } else if (P0 > want) {
          for (var j = 15; j >= 0; j--) if (z.pods[j].on) { z.pods[j].on = false; z.pods[j].t = 0; break; }
          z.cool = 0.1 + Math.random() * 0.1;
        }
      }
      // remove the top node once it has been empty for a moment
      for (var q = 3; q >= 1; q--) {
        var nd = z.nodes[q];
        if (nd.st !== "on") continue;
        var empty = !z.pods[q * 4].on && !z.pods[q * 4 + 1].on && !z.pods[q * 4 + 2].on && !z.pods[q * 4 + 3].on;
        var above = q < 3 && z.nodes[q + 1].st !== "off";
        nd.idle = empty && !above && want <= q * 4 ? nd.idle + dt : 0;
        if (nd.idle > 0.6) { nd.st = "out"; nd.t = 0; }
        break;
      }
      var pendOn = P0 < want && P0 >= R * 4 ? 1 : 0;
      z.pendA += (pendOn - z.pendA) * (1 - Math.exp(-dt * 10));
    }
    function draw(z, t) {
      z.nodes.forEach(function (nd) {
        if (nd.st === "in") {
          var a = clamp(nd.t / 0.6, 0, 1);
          T(nd.el, 0, -30 * (1 - E.outBack(a, 1.6))); O(nd.el, clamp(a * 3, 0, 1));
          if (a >= 1) nd.st = "on";
        } else if (nd.st === "out") {
          var b = clamp(nd.t / 0.45, 0, 1);
          T(nd.el, 0, -22 * E.inCubic(b)); O(nd.el, 1 - E.outQuad(b));
          if (b >= 1) nd.st = "off";
        } else { T(nd.el, 0, 0); O(nd.el, nd.st === "on" ? 1 : 0); }
      });
      z.pods.forEach(function (pd) {
        var ack = 1 - 0.35 * Math.max(0, 1 - pd.ack / 0.3);
        if (pd.on) { var a = clamp(pd.t / 0.3, 0, 1); T(pd.el, 0, 0, lerp(0.4, 1, E.outBack(a, 2.2))); O(pd.el, clamp(a * 2.5, 0, 1) * ack); }
        else { var b = clamp(pd.t / 0.22, 0, 1); T(pd.el, 0, 0, lerp(1, 0.55, b)); O(pd.el, 1 - b); }
      });
      T(z.pend, 0, Math.sin(t * 4) * 2.5); O(z.pend, z.pendA);
    }
    function settle(L) {
      Z.forEach(function (z, zi) {
        var w = target(zi, L), nn = Math.max(1, Math.ceil(w / 4));
        z.want = w;
        z.nodes.forEach(function (nd, k) { nd.st = k < nn ? "on" : "off"; nd.t = 9; });
        z.pods.forEach(function (pd, i) { pd.on = i < w; pd.t = 9; });
      });
    }
    return function (p, dt, t) {
      var L = load(p, t);
      if (first) { settle(L); first = false; }
      blink(dt);
      Z.forEach(function (z, zi) {
        z.want = target(zi, L);
        z.nodes.forEach(function (nd) { nd.t += dt; });
        z.pods.forEach(function (pd) { pd.t += dt; pd.ack += dt; });
        stepZone(z, zi, dt);
        draw(z, t);
      });
      emit(dt, 1 + 9 * L, function () {
        var w = Z.map(function (z) { return z.want; }), sum = w[0] + w[1] + w[2], r = Math.random() * sum, zi = r < w[0] ? 0 : r < w[0] + w[1] ? 1 : 2;
        P.spawn([{ el: ins[(Math.random() * 3) | 0], cls: "" }, { el: outs[zi] }], {
          speed: 190 + Math.random() * 70,
          end: function () { var on = Z[zi].pods.filter(function (x) { return x.on; }); if (on.length) on[(Math.random() * on.length) | 0].ack = 0; }
        });
      });
      P.update(dt, t);
    };
  }
  SCENES.scale = function (svg) {
    return scaler(svg, function (p) {
      // calm, a rush that peaks past the middle, then calm again
      return 0.08 + 0.92 * (E.inOutCubic(seg(p, 0.08, 0.55)) * (1 - 0.72 * E.inOutCubic(seg(p, 0.68, 1))));
    });
  };

  /* 3. Two regions, one entry ----------------------------------------- */
  SCENES.regions = function (svg) {
    var K = keys(svg); hideStill(svg);
    var P = Packets(svg, K.pk), emit = Emitter(), blink = leds(svg);
    var xs = [288, 300, 312];
    var through = { ie: [], jp: [] };
    xs.forEach(function (x) {
      through.ie.push(mkPath(svg, K.pk.parentNode, "M" + x + " 122C" + x + " 160 288 162 288 200"));
      through.jp.push(mkPath(svg, K.pk.parentNode, "M" + x + " 122C" + x + " 160 312 162 312 200"));
    });
    return function (p, dt, t) {
      blink(dt);
      var gs = seg(p, 0, 0.3);
      T(K.globe, 0, 60 * (1 - E.outCubic(gs))); O(K.globe, gs);
      var a = seg(p, 0.14, 0.34), b = seg(p, 0.26, 0.46);
      T(K.ie, 0, 0, lerp(0.5, 1, E.outBack(a, 2))); O(K.ie, Math.min(1, a * 3));
      T(K.jp, 0, 0, lerp(0.5, 1, E.outBack(b, 2))); O(K.jp, Math.min(1, b * 3));
      var d = seg(p, 0.4, 0.58);
      T(K.door, 0, -34 * (1 - E.outBack(d, 1.6))); O(K.door, Math.min(1, d * 2.5));
      O(K.users, seg(p, 0.5, 0.62)); O(K.routes, seg(p, 0.46, 0.6));
      O(K.lblIE, seg(p, 0.64, 0.76)); O(K.lblJP, seg(p, 0.7, 0.82));
      T(K.lblIE, 6 * (1 - E.outCubic(seg(p, 0.64, 0.76))), 0); T(K.lblJP, -6 * (1 - E.outCubic(seg(p, 0.7, 0.82))), 0);
      emit(dt, p > 0.56 ? 4.2 * seg(p, 0.56, 0.7) : 0, function () {
        var i = (Math.random() * 3) | 0, jp = Math.random() < 0.3;
        P.spawn([{ el: K["ri" + i], cls: jp ? "pk--cool" : "" }, { el: (jp ? through.jp : through.ie)[i] }, { el: jp ? K.rjp : K.rie }], { speed: 170 + Math.random() * 60 });
      });
      P.update(dt, t);
    };
  };

  /* 4. The IPv6 move ---------------------------------------------------- */
  SCENES.ipv6 = function (svg) {
    var K = keys(svg); hideStill(svg);
    var P = Packets(svg, K.pk), eA = Emitter(), eB = Emitter(), blink = leds(svg);
    var thruX = mkPath(svg, K.pk.parentNode, "M254 112H346");
    // where the IPv6 path meets the gate
    var dbL = K.rdb.getTotalLength(), gateD = dbL;
    for (var d = 0; d < dbL; d += 1) if (K.rdb.getPointAtLength(d).x >= 382 - 13) { gateD = d; break; }
    var open = 0, bLive = [];
    var gateLed = svg.querySelector('[data-k="bar-led"]');
    return function (p, dt, t) {
      blink(dt);
      // the address tag flips over
      var f = seg(p, 0.06, 0.24);
      T(K.tag, 0, 0, 1, f < 0.5 ? Math.max(0.001, 1 - E.inCubic(f * 2)) : Math.max(0.001, E.outBack((f - 0.5) * 2, 2.2)));
      O(K["tag-4"], f < 0.5 ? 1 : 0); O(K["tag-6"], f < 0.5 ? 0 : 1);
      var x1 = seg(p, 0.22, 0.34), x2 = seg(p, 0.28, 0.4);
      T(K.xlat, 0, 16 * (1 - E.outBack(x1, 1.6))); O(K.xlat, x1);
      T(K.legacy, 0, 16 * (1 - E.outBack(x2, 1.6))); O(K.legacy, x2);
      O(K.rx, seg(p, 0.24, 0.34)); O(K.rf, seg(p, 0.3, 0.4));
      var y1 = seg(p, 0.42, 0.54), y2 = seg(p, 0.48, 0.58);
      T(K.db, 0, 16 * (1 - E.outBack(y1, 1.6))); O(K.db, y1);
      T(K.gate, 0, -12 * (1 - E.outBack(y2, 1.6))); O(K.gate, y2);
      O(K.rdb, seg(p, 0.44, 0.54)); O(K.ridle, seg(p, 0.48, 0.58));
      // the gate opens late in the step: a small dip first, then up with a settle
      var g = seg(p, 0.78, 0.92);
      open = g;
      var sy = g < 0.18 ? 1 + 0.07 * Math.sin((g / 0.18) * Math.PI) : 1 - 0.9 * E.outBack((g - 0.18) / 0.82, 1.4);
      T(K.bar, 0, 0, 1, clamp(sy, 0.04, 1.1));
      if (gateLed) gateLed.classList.toggle("is-open", g > 0.6);
      eA(dt, p > 0.36 ? 1.5 : 0, function () {
        P.spawn([{ el: K.rx, cls: "" }, { el: thruX, hide: true }, { el: K.rf, cls: "pk--ink" }], { speed: 150 + Math.random() * 40 });
      });
      bLive = bLive.filter(function (k) { return P.live.indexOf(k) >= 0; });
      var queued = bLive.filter(function (k) { return k.d < gateD + 1; }).length;
      eB(dt, p > 0.56 && (open > 0.5 || queued < 4) ? 1.3 : 0, function () {
        var k = P.spawn([{ el: K.rdb, cls: "" }], {
          speed: 140 + Math.random() * 40,
          stop: function (me) {
            if (open > 0.55) return Infinity;
            if (me.d > gateD + 0.5) return Infinity;
            var ahead = 0;
            for (var i = 0; i < bLive.length && bLive[i] !== me; i++) if (bLive[i].d <= gateD + 0.5) ahead++;
            return gateD - ahead * 19;
          }
        });
        bLive.push(k);
      });
      P.update(dt, t);
    };
  };

  /* 5. One change, every cluster -------------------------------------- */
  SCENES.learned = function (svg) {
    var K = keys(svg), blink = leds(svg);
    var x0 = 196, cols = [236, 320, 404, 488], cw = 64, stubUp = 54, stubDn = 40;
    var spine = cols[3] + cw / 2 - x0, total = spine + stubUp;
    var dots = [];
    for (var i = 0; i < 9; i++) {
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("r", "4.5"); c.setAttribute("class", "k-pulse"); c.style.opacity = "0";
      K.pk.appendChild(c); dots.push(c);
    }
    return function (p, dt) {
      blink(dt);
      var cs = seg(p, 0.04, 0.2);
      T(K.commit, 0, -44 * (1 - E.outBack(cs, 1.8)), lerp(0.4, 1, E.outBack(cs, 1.8))); O(K.commit, Math.min(1, cs * 3));
      var D = seg(p, 0.22, 0.8) * total;
      T(K["lit-spine"], 0, 0, Math.max(0.001, clamp(D / (cols[3] + cw / 2 - x0 + 52), 0, 1)), 1);
      var front = x0 + D;
      dots[8].setAttribute("cx", Math.min(front, cols[3] + cw / 2)); dots[8].setAttribute("cy", 236); O(dots[8], D > 0 && D < spine ? 1 : 0);
      for (var s = 0; s < 8; s++) {
        var col = s >> 1, up = s % 2 === 0, len = up ? stubUp : stubDn, sx = cols[col] + cw / 2;
        var q = clamp((D - (sx - x0)) / len, 0, 1);
        T(K["lit" + s], 0, 0, 1, Math.max(0.001, q));
        dots[s].setAttribute("cx", sx); dots[s].setAttribute("cy", 236 + (up ? -1 : 1) * q * len);
        O(dots[s], q > 0 && q < 1 ? 1 : 0);
        var arrive = 0.22 + ((sx - x0 + len) / total) * 0.58;
        var u = seg(p, arrive, arrive + 0.08);
        T(K["c" + s], 0, -7 * Math.sin(Math.PI * u));
        O(K["c" + s + "-old"], 1 - u);
        T(K["c" + s + "-new"], 0, 0, 1, Math.max(0.001, E.outBack(u, 2.4))); O(K["c" + s + "-new"], Math.min(1, u * 3));
      }
    };
  };

  /* Homelab: one change, git push to running ------------------------------ */
  SCENES.loop = function (svg) {
    var K = keys(svg), blink = leds(svg); hideStill(svg);
    var put = Courier(svg, K.pk);
    var stopF = 0;
    var L = K["r-push"].getTotalLength();
    for (var d = 0; d < L; d++) if (K["r-push"].getPointAtLength(d).y >= 160 - 12) { stopF = d / L; break; }
    return function (p, dt, t) {
      blink(dt);
      var a = seg(p, 0, 0.05);
      T(K["c-push"], 0, 0, lerp(0.3, 1, E.outBack(a, 2.4))); O(K["c-push"], Math.min(1, a * 3));
      // the build works while the packet is inside
      var bw = seg(p, 0.16, 0.24), shake = bw > 0 && bw < 1 ? Math.sin(t * 40) * 1.2 : 0;
      T(K.hatch, 0, shake);
      if (K.buildled) K.buildled.classList.toggle("is-blink", bw > 0 && bw < 1 && Math.sin(t * 30) > 0);
      var cr = seg(p, 0.29, 0.35);
      T(K.crate, 0, -26 * (1 - E.outBack(cr, 1.8))); O(K.crate, Math.min(1, cr * 3));
      O(K["r-watch"], 0.35 + 0.65 * Math.sin(Math.PI * seg(p, 0.33, 0.44)));
      var tg = seg(p, 0.5, 0.55);
      T(K["c-tag"], 0, 0, lerp(0.3, 1, E.outBack(tg, 2.4))); O(K["c-tag"], Math.min(1, tg * 3));
      var sw = seg(p, 0.64, 0.74);
      O(K.oldpod, 1 - seg(sw, 0, 0.4)); T(K.oldpod, 0, 0, lerp(1, 0.6, seg(sw, 0, 0.4)));
      T(K.newpod, 0, 0, lerp(0.4, 1, E.outBack(seg(sw, 0.3, 1), 2.2))); O(K.newpod, seg(sw, 0.3, 0.6));
      // the loop: the gate shows up, closes, and the tag commit's build waits there and gives up
      var gs = seg(p, 0.74, 0.8), gc = seg(p, 0.76, 0.86);
      O(K.gate, gs); T(K.bar, 0, 0, 1, clamp(gc < 0.8 ? lerp(0.05, 1.08, E.outCubic(gc / 0.8)) : lerp(1.08, 1, (gc - 0.8) / 0.2), 0.02, 1.1));
      if (p < 0.05) put(null);
      else if (p < 0.16) put(K["r-push"], E.inOutCubic(seg(p, 0.05, 0.16)), "pk--ink");
      else if (p < 0.24) put(null);
      else if (p < 0.31) put(K["r-ship"], E.inOutCubic(seg(p, 0.24, 0.31)), "");
      else if (p < 0.34) put(null);
      else if (p < 0.43) put(K["r-watch"], E.inOutCubic(seg(p, 0.34, 0.43)), "pk--cool");
      else if (p < 0.46) put(null);
      else if (p < 0.52) put(K["r-tag"], E.inOutCubic(seg(p, 0.46, 0.52)), "pk--ink");
      else if (p < 0.58) put(K["r-sync"], E.inOutCubic(seg(p, 0.52, 0.58)), "pk--ink");
      else if (p < 0.65) put(K["r-roll"], E.inOutCubic(seg(p, 0.58, 0.65)), "pk--ink");
      else if (p < 0.78) put(null);
      else {
        var w = seg(p, 0.78, 0.86), wait = seg(p, 0.86, 0.97);
        put(K["r-push"], stopF * E.outCubic(w) + (wait > 0 && wait < 1 ? Math.sin(t * 22) * 0.012 : 0), "pk--ink", 1 - E.inCubic(seg(p, 0.9, 0.98)));
      }
    };
  };

  /* Homepage card: platform (time-based) ---------------------------------- */
  SCENES.cardscale = function (svg) {
    return scaler(svg, function (p, t) { return 0.42 + 0.38 * Math.sin((t / 15) * Math.PI * 2 - 1.2) + 0.08 * Math.sin(t * 0.9); });
  };
  /* Homepage card: homelab loop (time-based) ------------------------------- */
  SCENES.cardloop = function (svg) {
    var K = keys(svg), blink = leds(svg); hideStill(svg);
    var put = Courier(svg, K.pk), loop = K.loop, L = loop.getTotalLength();
    function near(x, y) { var best = 0, bd = 1e9; for (var d = 0; d < L; d += 2) { var q = loop.getPointAtLength(d), dd = (q.x - x) * (q.x - x) + (q.y - y) * (q.y - y); if (dd < bd) { bd = dd; best = d; } } return best / L; }
    var fBuild = near(112, 243), fLap = near(250, 180);
    var phase = 0;
    return function (p, dt, t, speed) {
      blink(dt);
      phase = (phase + dt * (speed || 1) / 7) % 1;
      var f = phase;
      put(loop, f, f > fLap ? "pk--ink" : "");
      var c = seg(f, 0, 0.06);
      T(K["c-new"], 0, 0, 1 + 0.35 * Math.sin(Math.PI * c));
      var inB = Math.abs(f - fBuild) < 0.05;
      T(K.hatch, 0, inB ? Math.sin(t * 40) * 1 : 0);
      if (K.buildled) K.buildled.classList.toggle("is-blink", inB && Math.sin(t * 30) > 0);
      var pp = seg(f, fLap, fLap + 0.08), out = seg(f, 0.94, 1);
      T(K.newpod, 0, 0, pp > 0 ? lerp(0.4, 1, E.outBack(pp, 2.2)) : 0.4); O(K.newpod, Math.min(pp * 2.5, 1) * (1 - out));
    };
  };

  /* ================================================================ controller */
  var running = false, last = 0, awake = new Set(), WIDE = matchMedia("(min-width: 900px)");
  function make(fig, id) {
    var svg = fig.querySelector("svg.scene-svg");
    if (!svg || !SCENES[id]) return null;
    return { fig: fig, svg: svg, run: SCENES[id](svg), p: 0, ps: -1, t: 0, speed: 1, speedT: 1 };
  }
  function kick() { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } }

  var sections = [];
  Array.prototype.forEach.call(document.querySelectorAll(".scenes"), function (sec) {
    var stage = sec.querySelector(".scenes__stage");
    var steps = Array.prototype.slice.call(sec.querySelectorAll(".scene-step"));
    var primary = {}, items = [];
    steps.forEach(function (st) {
      var id = st.getAttribute("data-scene"), r = (st.getAttribute("data-range") || "0 1").split(" ").map(Number);
      var fig = st.querySelector(".scene");
      if (!fig) return;
      if (!fig.querySelector("svg") && primary[id]) {
        var c = primary[id].fig.querySelector("svg").cloneNode(true);
        c.removeAttribute("role"); c.setAttribute("aria-hidden", "true");
        fig.appendChild(c);
      }
      var a = make(fig, id);
      if (!a) return;
      var it = { step: st, id: id, a0: r[0], a1: r[1], anim: a, home: fig.parentNode, next: fig.nextSibling };
      items.push(it);
      if (!primary[id]) primary[id] = { fig: fig, it: it };
    });
    if (!items.length) return;
    var S = { sec: sec, stage: stage, steps: steps, items: items, primary: primary, wide: null, visible: false, active: null };
    sections.push(S);
    new IntersectionObserver(function (en) { en.forEach(function (e) { S.visible = e.isIntersecting; if (S.visible) kick(); }); }, { rootMargin: "10% 0px" }).observe(sec);
    items.forEach(function (it) {
      new IntersectionObserver(function (en) { en.forEach(function (e) { it.seen = e.isIntersecting; if (it.seen) kick(); }); }, { rootMargin: "5% 0px" }).observe(it.anim.fig);
    });
  });
  function layout() {
    sections.forEach(function (S) {
      var wide = WIDE.matches && !!S.stage;
      if (wide === S.wide) return;
      S.wide = wide;
      S.sec.classList.toggle("is-staged", wide);
      Object.keys(S.primary).forEach(function (id) {
        var it = S.primary[id].it, fig = it.anim.fig;
        if (wide) S.stage.appendChild(fig); else it.home.insertBefore(fig, it.next && it.next.parentNode === it.home ? it.next : it.home.firstChild);
      });
    });
    kick();
  }
  if (sections.length) {
    document.documentElement.classList.add("js-scenes");
    layout();
    if (WIDE.addEventListener) WIDE.addEventListener("change", layout); else if (WIDE.addListener) WIDE.addListener(layout);
  }

  // homepage cards
  var cards = [];
  Array.prototype.forEach.call(document.querySelectorAll("[data-card]"), function (box) {
    var a = make(box, box.getAttribute("data-card"));
    if (!a) return;
    var c = { anim: a, seen: false };
    cards.push(c);
    var link = box.closest("a") || box;
    link.addEventListener("mouseenter", function () { a.speedT = 1.7; });
    link.addEventListener("mouseleave", function () { a.speedT = 1; });
    link.addEventListener("focus", function () { a.speedT = 1.7; });
    link.addEventListener("blur", function () { a.speedT = 1; });
    new IntersectionObserver(function (en) { en.forEach(function (e) { c.seen = e.isIntersecting; if (c.seen) kick(); }); }).observe(box);
  });

  function tick(a, p, dt) {
    // scroll progress is smoothed, so a jumpy wheel still reads as one motion
    if (a.ps < 0) a.ps = p; else a.ps += (p - a.ps) * (1 - Math.exp(-dt * 7));
    if (Math.abs(a.ps - p) < 0.0005) a.ps = p;
    a.speed += (a.speedT - a.speed) * (1 - Math.exp(-dt * 4));
    a.t += dt * a.speed;
    a.run(a.ps, dt * a.speed, a.t, a.speed);
  }
  function frame(now) {
    var dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    var vh = window.innerHeight, any = false;
    // read every rect first, then write
    var jobs = [];
    sections.forEach(function (S) {
      if (S.wide) {
        if (!S.visible) return;
        any = true;
        var rects = S.steps.map(function (st) { return st.getBoundingClientRect(); });
        var idx = 0;
        for (var i = 0; i < rects.length; i++) if (rects[i].top <= vh * 0.5) idx = i;
        var it = S.items.filter(function (x) { return x.step === S.steps[idx]; })[0] || S.items[0];
        var r = rects[S.steps.indexOf(it.step)];
        // the first step only starts once the stage is pinned (section top at the header)
        var lead = idx === 0 ? Math.max(0, vh * 0.5 - 64) : 0;
        var local = clamp((vh * 0.5 - lead - r.top) / Math.max(1, r.height - vh * 0.25 - lead), 0, 1);
        jobs.push([S, it, it.a0 + (it.a1 - it.a0) * local]);
      } else {
        S.items.forEach(function (it) {
          if (!it.seen) return;
          any = true;
          var r = it.anim.fig.getBoundingClientRect();
          jobs.push([null, it, it.a0 + (it.a1 - it.a0) * clamp((vh * 0.92 - r.top) / (vh * 0.6), 0, 1)]);
        });
      }
    });
    jobs.forEach(function (j) {
      var S = j[0], it = j[1];
      if (S && S.active !== it) {
        S.steps.forEach(function (st) { st.classList.toggle("is-active", st === it.step); });
        var fig = S.primary[it.id].it.anim.fig;
        Array.prototype.forEach.call(S.stage.children, function (f) { f.classList.toggle("is-on", f === fig); });
        S.active = it;
      }
      tick(S ? S.primary[it.id].it.anim : it.anim, j[2], dt);
    });
    cards.forEach(function (c) { if (c.seen) { any = true; tick(c.anim, 0, dt); } });
    if (any) requestAnimationFrame(frame); else running = false;
  }
  kick();
})();
