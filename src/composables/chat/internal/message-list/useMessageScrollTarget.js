/**
 * @file useMessageScrollTarget.js
 * @description 채팅방 진입 준비 흐름에서 최초 스크롤 위치(bottom/first/message)를 계산하고 적용합니다.
 */

import {MESSAGE_SCROLL_TARGET_TYPES} from "./messageRenderPolicyTypes";

function getSafeScrollTop(container, top) {
  if (!container) return 0;
  const maxScrollTop = Math.max(
    0,
    container.scrollHeight - container.clientHeight
  );
  const numeric = Number(top);
  return Math.min(
    maxScrollTop,
    Math.max(0, Number.isFinite(numeric) ? numeric : 0)
  );
}

function getElementOffsetTopWithinScroll(element, container) {
  if (!element || !container) return 0;

  const containerRect = container.getBoundingClientRect?.();
  const elementRect = element.getBoundingClientRect?.();
  if (containerRect && elementRect) {
    return container.scrollTop + elementRect.top - containerRect.top;
  }

  let top = 0;
  let current = element;
  while (current && current !== container) {
    top += Number(current.offsetTop || 0);
    current = current.offsetParent;
  }
  return top;
}

function normalizeMessageId(value) {
  const id = String(value || "").trim();
  return id || "";
}

function findMessageElementById(container, messageId) {
  const targetId = normalizeMessageId(messageId);
  if (!container || !targetId) return null;

  const nodes = container.querySelectorAll?.("[data-message-id]") || [];
  for (const node of nodes) {
    if (String(node?.getAttribute?.("data-message-id") || "") === targetId) {
      return node;
    }
  }
  return null;
}

function getFirstMessageElement(container) {
  return container?.querySelector?.("[data-message-id]") || null;
}

export function createMessageScrollTargetController({
  getScrollElement,
  getScrollRoot,
  getBottomElement,
  updateBottomState,
} = {}) {
  function scrollToBottom({behavior = "auto"} = {}) {
    const el = getScrollElement?.();
    if (!el) return false;

    const bottom = getBottomElement?.();
    if (bottom?.scrollIntoView) {
      bottom.scrollIntoView({block: "end", inline: "nearest", behavior});
    }

    el.scrollTop = getSafeScrollTop(el, el.scrollHeight - el.clientHeight);
    updateBottomState?.();
    return true;
  }

  function scrollToFirstMessage({behavior = "auto"} = {}) {
    const el = getScrollElement?.();
    if (!el) return false;

    const target = getFirstMessageElement(getScrollRoot?.() || el);
    if (!target) {
      el.scrollTop = 0;
      updateBottomState?.();
      return true;
    }

    const top = getElementOffsetTopWithinScroll(target, el);
    el.scrollTo?.({top: getSafeScrollTop(el, top), behavior}) ??
      (el.scrollTop = getSafeScrollTop(el, top));
    updateBottomState?.();
    return true;
  }

  function scrollToMessage(
    messageId,
    {behavior = "auto", block = "center"} = {}
  ) {
    const el = getScrollElement?.();
    if (!el) return false;

    const target = findMessageElementById(getScrollRoot?.() || el, messageId);
    if (!target) return false;

    const targetTop = getElementOffsetTopWithinScroll(target, el);
    const nextTop =
      block === "center"
        ? targetTop - el.clientHeight / 2 + target.offsetHeight / 2
        : targetTop - 16;

    el.scrollTo?.({top: getSafeScrollTop(el, nextTop), behavior}) ??
      (el.scrollTop = getSafeScrollTop(el, nextTop));
    updateBottomState?.();
    return true;
  }

  function applyScrollTarget(scrollTarget = {}, options = {}) {
    const type = scrollTarget?.type || MESSAGE_SCROLL_TARGET_TYPES.bottom;
    const behavior = options.behavior || scrollTarget.behavior || "auto";

    if (type === MESSAGE_SCROLL_TARGET_TYPES.message) {
      return scrollToMessage(scrollTarget.messageId, {
        behavior,
        block: scrollTarget.block || options.block || "center",
      });
    }

    if (type === MESSAGE_SCROLL_TARGET_TYPES.first) {
      return scrollToFirstMessage({behavior});
    }

    return scrollToBottom({behavior});
  }

  return {
    scrollToBottom,
    scrollToFirstMessage,
    scrollToMessage,
    applyScrollTarget,
  };
}
