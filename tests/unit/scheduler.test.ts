import { describe, expect, it, vi } from "vitest";
import { createScheduler, MAX_DT } from "~/lib/motion/scheduler";

/** A fake clock and frame queue. */
function env() {
  let now = 0;
  const queue: ((t: number) => void)[] = [];
  let hidden = false;
  return {
    raf: (cb: (t: number) => void) => queue.push(cb),
    now: () => now,
    hidden: () => hidden,
    /** Advances time and runs the frames that were queued. */
    frame(ms: number) {
      now += ms;
      const due = queue.splice(0);
      due.forEach((cb) => cb(now));
      return due.length;
    },
    hide: (h: boolean) => void (hidden = h),
    get queued() {
      return queue.length;
    },
  };
}

describe("scheduler", () => {
  it("runs tasks while they have work, then sleeps", () => {
    const e = env();
    const s = createScheduler(e);
    let frames = 0;
    s.add(() => ++frames < 3);
    e.frame(16);
    e.frame(16);
    e.frame(16);
    expect(frames).toBe(3);
    expect(s.running).toBe(false);
    expect(e.queued).toBe(0);
  });

  it("passes seconds, capped so a stall doesn't teleport anything", () => {
    const e = env();
    const s = createScheduler(e);
    const dts: number[] = [];
    s.add((dt) => (dts.push(dt), dts.length < 2));
    e.frame(16);
    e.frame(2000);
    expect(dts[0]).toBeCloseTo(0.016);
    expect(dts[1]).toBe(MAX_DT);
  });

  it("wakes again, without counting the time it slept", () => {
    const e = env();
    const s = createScheduler(e);
    const dts: number[] = [];
    let work = 1;
    s.add((dt) => (dts.push(dt), --work > 0));
    e.frame(16);
    e.frame(10_000); // asleep: nothing queued, nothing runs
    work = 1;
    s.wake();
    e.frame(16);
    expect(dts).toHaveLength(2);
    expect(dts[1]).toBeCloseTo(0.016);
  });

  it("stops while the page is hidden and doesn't start hidden", () => {
    const e = env();
    const s = createScheduler(e);
    s.add(() => true);
    e.hide(true);
    e.frame(16);
    expect(s.running).toBe(false);
    s.wake();
    expect(e.queued).toBe(0);
  });

  it("can remove a task", () => {
    const e = env();
    const s = createScheduler(e);
    let runs = 0;
    const remove = s.add(() => (runs++, true));
    e.frame(16);
    remove();
    e.frame(16);
    expect(runs).toBe(1);
    expect(s.running).toBe(false);
  });

  it("drops a task that throws, reports it, and keeps the loop and the others alive", () => {
    const e = env();
    const errors: unknown[] = [];
    const s = createScheduler({ ...e, report: (err) => errors.push(err) });
    let calls = 0,
      frames = 0;
    s.add(() => {
      calls++;
      throw new Error("boom");
    });
    s.add(() => ++frames < 3);
    e.frame(16);
    e.frame(16);
    e.frame(16);
    expect(calls).toBe(1);
    expect(errors).toHaveLength(1);
    expect((errors[0] as Error).message).toBe("boom");
    expect(frames).toBe(3);
    expect(s.running).toBe(false);
  });

  it("logs a dropped task to the console by default", () => {
    const e = env();
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const s = createScheduler(e);
    s.add(() => {
      throw new Error("boom");
    });
    e.frame(16);
    expect(spy).toHaveBeenCalledOnce();
    expect(s.running).toBe(false);
    spy.mockRestore();
  });
});
