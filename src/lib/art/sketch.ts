/** The kit's parts side by side, for the styleguide (/design-system/). */
import {
  addrTag,
  appliance,
  appWin,
  database,
  gate,
  hall,
  laptop,
  miniLaptop,
  nodeBody,
  packet,
  phone,
  pod,
  podSlot,
  portal,
  rack,
  server,
  shadow,
  tower,
} from "./kit";
import { S2 } from "./scenes/platform.layout";
import { path, svg } from "./svg";

export function sketch(): string {
  let b = path("M20 300.5H1180", "k-ground");
  b += rack(40, 80, 128, 218);
  for (const k of [0, 1]) {
    const nx = 50,
      ny = S2.slotY(k) - S2.top + 80;
    b +=
      nodeBody(nx, ny, 108, 44, 4) +
      [0, 1, 2, 3]
        .slice(0, k ? 2 : 4)
        .map((s) => pod(podSlot(nx, ny, 108, 44, 4, s)))
        .join("");
  }
  b += shadow(290, 302, 130) + server(230, 254, 120, 22) + server(230, 278, 120, 22, { bays: 2 });
  b += laptop(500, 290, 200).svg;
  b += database(700, 210, 92, 80);
  b += tower(780, 200, 70, 96);
  b += gate(900, 230, 278, "bar");
  b += portal(1000, 200, 78, 80);
  b += appWin(1080, 120, 90, 64, "hero") + appWin(1080, 200, 90, 64, "shop");
  b += packet(260, 120, 0) + packet(300, 130, 20, "pk--cool") + packet(340, 140, 40, "pk--ink");
  b += addrTag(380, 100, "tag");
  b += phone(260, 40) + miniLaptop(330, 74);
  b += hall(700, 60, 88, 58);
  b += appliance(860, 80, 92, 46, ["6", "4"]);
  return svg(
    "sketch",
    "0 0 1200 330",
    "The illustration kit: a rack of nodes with pods, servers, a laptop, a database, an old tower, a gate, a doorway, app windows, packets, an address tag, a phone, a small laptop, a data hall and a network appliance.",
    b,
  );
}
