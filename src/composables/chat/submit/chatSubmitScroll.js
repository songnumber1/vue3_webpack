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

        if (options.autoScrollOnAnswer?.value) {
          await options.scrollBottom({
            force: true,
            stable: true,
            autoAnswer: true,
          });
          return;
        }

        // 자동 스크롤 OFF 상태에서는 답변 chunk 수신마다 위치를 다시 보정하지 않습니다.
        // 질문 직후 1회만 사용자 질문으로 이동하고, 이후에는 사용자의 수동 스크롤을 존중해야
        // 긴 답변 생성 중 화면이 위아래로 흔들리거나 사용자가 내린 스크롤이 다시 올라가지 않습니다.
        options.onManualStreamScrollSkipped?.();
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
    stable: false,
    initialOnly: true,
    offset: 16,
    pageFallback: normalized.keyboardOpenOnSubmit === true,
    keyboardOpenOnSubmit: normalized.keyboardOpenOnSubmit === true,
  });
}
