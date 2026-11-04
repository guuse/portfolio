/**
 * One requestAnimationFrame loop for the whole page. Tasks run every frame while at least
 * one of them says it still has work; then the loop sleeps until someone calls wake()
 * (typically an IntersectionObserver noticing a scene on screen). It also sleeps while the
 * tab is hidden, and the first frame after waking never sees a huge time step. A task that
 * throws is logged and dropped; the loop and every other task keep going.
 */

/** A frame task. Gets seconds since the last frame; returns true while it wants more frames. */
export type Task = (dt: number) => boolean;

export interface SchedulerEnv {
  raf: (cb: (now: number) => void) => number;
  now: () => number;
  /** Is the page hidden? Defaults to never. */
  hidden?: () => boolean;
  /** Told about a task that threw (it has been dropped). Defaults to console.error. */
  report?: (error: unknown) => void;
}

/** The longest step a frame may take, so a stalled tab doesn't teleport anything. */
export const MAX_DT = 0.05;

export function createScheduler(env: SchedulerEnv) {
  const tasks = new Set<Task>();
  let running = false;
  let last = 0;
  const report =
    env.report ?? ((error: unknown) => console.error("scheduler: a frame task threw and was dropped", error));

  function frame(now: number): void {
    const dt = Math.min(MAX_DT, Math.max(0, (now - last) / 1000));
    last = now;
    if (env.hidden?.()) {
      running = false;
      return;
    }
    let busy = false;
    for (const task of tasks) {
      // one broken animation must not stop the others: drop it, say so, carry on
      try {
        if (task(dt)) busy = true;
      } catch (error) {
        tasks.delete(task);
        report(error);
      }
    }
    if (busy) env.raf(frame);
    else running = false;
  }

  return {
    /** Adds a task and wakes the loop. Returns a function that removes it. */
    add(task: Task): () => void {
      tasks.add(task);
      this.wake();
      return () => tasks.delete(task);
    },
    /** Starts the loop if it is asleep. */
    wake(): void {
      if (running || env.hidden?.()) return;
      running = true;
      last = env.now();
      env.raf(frame);
    },
    get running(): boolean {
      return running;
    },
  };
}

export type Scheduler = ReturnType<typeof createScheduler>;

/** The page's scheduler, bound to the real browser. */
export function browserScheduler(): Scheduler {
  const s = createScheduler({
    raf: (cb) => requestAnimationFrame(cb),
    now: () => performance.now(),
    hidden: () => document.hidden,
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) s.wake();
  });
  return s;
}
