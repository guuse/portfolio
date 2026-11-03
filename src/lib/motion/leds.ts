/** Blinks a few activity LEDs at random, so the machines look switched on. */
export function blinker(svg: SVGSVGElement): (dt: number) => void {
  // LEDs with a key are driven by their scene; of the rest, every other one blinks (max 10)
  const list = [...svg.querySelectorAll(".k-led--act")]
    .filter((l) => !l.hasAttribute("data-k"))
    .filter((_, i) => i % 2 === 0)
    .slice(0, 10);
  const next = list.map(() => Math.random() * 2);
  return (dt) => {
    list.forEach((led, i) => {
      next[i]! -= dt;
      if (next[i]! <= 0) {
        const on = !led.classList.contains("is-blink");
        led.classList.toggle("is-blink", on);
        next[i] = on ? 0.06 + Math.random() * 0.12 : 0.3 + Math.random() * 2.2;
      }
    });
  };
}
