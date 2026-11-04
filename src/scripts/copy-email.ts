/**
 * Email addresses are mailto: links with a Copy button next to them. The button never changes
 * width (CopyButton.astro stacks its labels); it shows a check and "Copied" when it worked. If
 * the clipboard is unavailable or refuses, the address is selected instead, the button says
 * "Selected", and the live region says how to copy it on this kind of device.
 */
const RESET_AFTER = 2200;

function selectText(el: Element): void {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

const touch = (): boolean => matchMedia("(pointer: coarse)").matches;

export function initCopyEmail(): void {
  for (const btn of document.querySelectorAll<HTMLButtonElement>("[data-copy-target]")) {
    const target = document.getElementById(btn.dataset["copyTarget"] ?? "");
    const status = document.getElementById(btn.getAttribute("aria-describedby") ?? "");
    if (!target) continue;
    // it ships hidden (CopyButton.astro): a button only once it can do something
    btn.hidden = false;
    let timer = 0;
    const say = (state: "done" | "fail", sentence: string): void => {
      btn.dataset["state"] = state;
      if (status) status.textContent = sentence;
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        delete btn.dataset["state"];
        if (status) status.textContent = "";
      }, RESET_AFTER);
    };
    const fallback = (): void => {
      selectText(target);
      say(
        "fail",
        touch() ? "Selected. Use Copy from the menu." : "Selected. Press Ctrl+C, or Cmd+C on a Mac, to copy.",
      );
    };
    btn.addEventListener("click", () => {
      const text = target.textContent.trim();
      // absent outside a secure context, whatever the DOM types say
      const clipboard = navigator.clipboard as Clipboard | undefined;
      if (!clipboard) {
        fallback();
        return;
      }
      clipboard.writeText(text).then(() => say("done", "Copied to the clipboard."), fallback);
    });
  }
}
