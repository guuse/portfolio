/** True unless the visitor asked for less motion. Everything that moves checks this first. */
export const motionOk = (): boolean => !matchMedia("(prefers-reduced-motion: reduce)").matches;
