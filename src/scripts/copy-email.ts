/**
 * Email addresses are selectable text with a Copy button next to them (no mailto:). If the
 * clipboard is unavailable, the address is selected so Ctrl/Cmd+C works.
 */
const RESET_AFTER = 2200;

function selectText(el: Element): void {
  const range = document.createRange();
  range.selectNodeContents(el);
  const sel = getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
}

export function initCopyEmail(): void {
  for (const btn of document.querySelectorAll<HTMLButtonElement>("[data-copy-target]")) {
    const target = document.getElementById(btn.dataset["copyTarget"] ?? "");
    const label = btn.querySelector(".copy__label");
    const status = document.getElementById(btn.getAttribute("aria-describedby") ?? "");
    if (!target) continue;
    const original = label?.textContent ?? "";
    let timer = 0;
    const say = (msg: string): void => {
      if (label) label.textContent = msg;
      if (status) status.textContent = msg;
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (label) label.textContent = original;
        if (status) status.textContent = "";
      }, RESET_AFTER);
    };
    const fallback = (): void => {
      selectText(target);
      say("Selected, press Ctrl/Cmd+C");
    };
    btn.addEventListener("click", () => {
      const text = (target.textContent ?? "").trim();
      if (!navigator.clipboard) return fallback();
      navigator.clipboard.writeText(text).then(() => say("Copied"), fallback);
    });
  }
}
