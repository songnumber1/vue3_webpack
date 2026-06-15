import {
  applyWindowFallbackScroll,
  getScrollableAncestors,
  scrollElementToTarget,
} from "./messageListScrollUtils";

export function createLatestUserMessageElementFinder({
  props,
  getScrollElement,
}) {
  let latestUserMessageCache = null;
  let latestUserMessageCacheKey = "";

  function getLatestUserMessageKey() {
    const list = props.messages || [];
    for (let index = list.length - 1; index >= 0; index -= 1) {
      const message = list[index];
      if (message?.role === "user") {
        return String(message.id ?? `user-${index}`);
      }
    }
    return "";
  }

  function getLatestUserMessageElement() {
    const el = getScrollElement();
    if (!el) return null;

    const cacheKey = getLatestUserMessageKey();
    if (
      cacheKey &&
      latestUserMessageCacheKey === cacheKey &&
      latestUserMessageCache &&
      el.contains(latestUserMessageCache)
    ) {
      return latestUserMessageCache;
    }

    let target = null;
    if (cacheKey) {
      const escapedKey =
        typeof CSS !== "undefined" && typeof CSS.escape === "function"
          ? CSS.escape(cacheKey)
          : cacheKey.replace(/"/g, '\\"');
      target = el.querySelector(`[data-message-id="${escapedKey}"]`);
    }

    // ID 기반 조회가 실패한 예외 케이스에서만 전체 DOM 검색으로 폴백합니다.
    // 긴 대화방 resize 중 querySelectorAll을 반복하면 프레임이 크게 밀릴 수 있습니다.
    if (!target) {
      const userMessages = el.querySelectorAll(
        '[data-message-role="user"], article.message--user, .message--user'
      );
      target = userMessages.length
        ? userMessages[userMessages.length - 1]
        : null;
    }

    latestUserMessageCacheKey = cacheKey;
    latestUserMessageCache = target;
    return target;
  }

  function resetLatestUserMessageCache() {
    latestUserMessageCache = null;
    latestUserMessageCacheKey = "";
  }

  return {
    getLatestUserMessageElement,
    resetLatestUserMessageCache,
  };
}

export function createMessageTargetScrollController({
  props,
  getScrollElement,
  getLatestUserMessageElement,
  messageScrollTarget,
  recalculateFocusSpacerHeight,
  updateBottomState,
  updateOverlayScrollbarFrame,
  clearStableTimers,
  scheduleTrackedAnimationFrame,
  trackStableTimer,
  stableScrollDelays,
  keyboardSubmitStableScrollDelays,
}) {
  function applyElementScroll(target, options = {}) {
    const el = getScrollElement();
    if (!el || !target) return false;

    const ancestors = getScrollableAncestors(target);
    const scrollTargets = [el, ...ancestors].filter(
      (item, index, array) => item && array.indexOf(item) === index
    );

    let applied = false;
    scrollTargets.forEach((container) => {
      applied = scrollElementToTarget(container, target, options) || applied;
    });

    applyWindowFallbackScroll(target, el.getBoundingClientRect(), options);
    updateBottomState();
    return applied;
  }

  function scrollToLatestUserMessage(options = {}) {
    clearStableTimers();

    if (props.historyRendering) return;

    const target = getLatestUserMessageElement();
    if (!target) return;

    const applyLatestUserAnchor = (anchorOptions = options) => {
      recalculateFocusSpacerHeight(anchorOptions);
      updateOverlayScrollbarFrame();
      return applyElementScroll(target, anchorOptions);
    };

    const applied = applyLatestUserAnchor(options);
    if (!applied) return;

    // 자동 스크롤 OFF + 질문/재생성 직후에는 마지막 질문 박스가 화면 상단에
    // 보여야 합니다. 이때 하단 spacer ref를 먼저 계산해도 DOM에는 다음 tick/paint에
    // 반영되므로, 즉시 scroll만 수행하면 브라우저가 최대 scrollTop으로 clamp하여
    // 질문 박스가 중간/하단에 머무를 수 있습니다.
    // 따라서 manual stream의 최초 앵커 이동에 한해서 spacer DOM 반영 후 짧게 재적용합니다.
    // 예약 타이머는 stableScrollTimerIds로 관리하여 사용자가 wheel/touch로 스크롤하면
    // handleUserScrollIntent()에서 즉시 취소되므로 답변 수신 중 수동 스크롤은 존중됩니다.
    if (props.loading && !props.autoScrollOnAnswer) {
      const delays = options.initialOnly ? [0, 32, 80] : [0, 32, 80, 160];
      delays.forEach((delay) => {
        const timerId = window.setTimeout(() => {
          scheduleTrackedAnimationFrame(() => {
            applyLatestUserAnchor({...options, behavior: "auto"});
          });
        }, delay);
        trackStableTimer(timerId);
      });
      return;
    }

    if (!options.stable) return;

    const delays = options.keyboardOpenOnSubmit
      ? keyboardSubmitStableScrollDelays
      : stableScrollDelays;

    delays.forEach((delay) => {
      const timerId = window.setTimeout(() => {
        scheduleTrackedAnimationFrame(() => {
          applyLatestUserAnchor({...options, behavior: "auto"});
        });
      }, delay);
      trackStableTimer(timerId);
    });
  }

  function scrollToInitialTarget(scrollTarget = {}, options = {}) {
    clearStableTimers();
    return messageScrollTarget.applyScrollTarget(
      scrollTarget || {type: "bottom"},
      {
        behavior: "auto",
        block: "center",
        ...options,
      }
    );
  }

  return {
    applyElementScroll,
    getLatestUserMessageElement,
    scrollToInitialTarget,
    scrollToLatestUserMessage,
  };
}
