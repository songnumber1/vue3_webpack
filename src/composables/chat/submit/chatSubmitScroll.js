import {nextTick} from "vue";
import {logWarn} from "@/utils/logger";

function isDocumentHidden() {
  return typeof document !== "undefined" && document.hidden;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function waitAnimationFrame() {
  return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

async function waitForKeyboardViewportToSettle() {
  if (typeof window === "undefined") return;

  const viewport = window.visualViewport;
  if (!viewport) {
    await wait(240);
    return;
  }

  let lastHeight = viewport.height;
  let lastChangeAt = Date.now();
  const startedAt = Date.now();

  const handleResize = () => {
    const nextHeight = viewport.height;
    if (Math.abs(nextHeight - lastHeight) > 1) {
      lastHeight = nextHeight;
      lastChangeAt = Date.now();
    }
  };

  viewport.addEventListener("resize", handleResize, {passive: true});
  try {
    while (Date.now() - startedAt < 900) {
      handleResize();
      if (Date.now() - lastChangeAt >= 140) break;
      await wait(40);
    }
    await waitAnimationFrame();
    await waitAnimationFrame();
  } finally {
    viewport.removeEventListener("resize", handleResize);
  }
}

export function createStreamScrollScheduler(options) {
  let pending = false;

  return () => {
    if (pending || isDocumentHidden()) return;

    pending = true;
    Promise.resolve()
      .then(async () => {
        pending = false;
        if (isDocumentHidden()) return;

        await nextTick();
        if (isDocumentHidden()) return;

        await options.scrollBottom({
          force: true,
          stable: true,
          autoAnswer: true,
        });
      })
      .catch((error) => {
        pending = false;
        logWarn("[useChatSubmit] stream scroll failed:", error);
      });
  };
}

export async function scrollAfterUserSubmit(options, normalized = {}) {
  await nextTick();

  if (options.autoScrollOnAnswer?.value) {
    await options.scrollBottom({force: true, stable: true, autoAnswer: true});
    return;
  }

  if (normalized.keyboardOpenOnSubmit) {
    await waitForKeyboardViewportToSettle();
    await nextTick();
  }

  await options.scrollLatestUserMessage?.({
    behavior: "auto",
    stable: true,
    offset: 16,
    pageFallback: normalized.keyboardOpenOnSubmit === true,
    keyboardOpenOnSubmit: normalized.keyboardOpenOnSubmit === true,
  });
}
