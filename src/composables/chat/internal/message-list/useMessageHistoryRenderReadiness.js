import {MESSAGE_SCROLL_TARGET_TYPES} from "./useMessageRenderPolicy";
import {
  countMermaidBlocksInText,
  isAssistantErrorMessage,
} from "./messageListScrollUtils";

export function createMessageHistoryRenderReadinessController({
  props,
  scrollRef,
  getScrollElement,
  getHistoryRenderMessageKey,
  isMermaidRenderingEnabled,
}) {
  function createHistoryRenderDomIndex() {
    const root = scrollRef.value;
    const messages = props.messages || [];
    const messageElements = root?.isConnected
      ? Array.from(root.querySelectorAll("[data-message-id]"))
      : [];
    const elementById = new Map();

    messageElements.forEach((element) => {
      const id = element.getAttribute("data-message-id");
      if (id && !elementById.has(id)) {
        elementById.set(id, element);
      }
    });

    return {
      root,
      messages,
      messageElements,
      elementById,
    };
  }

  function getHistoryRenderMessageElementFromIndex(domIndex, message, index) {
    if (!domIndex?.root?.isConnected) return null;

    const key = getHistoryRenderMessageKey(message, index);
    const exactElement = domIndex.elementById.get(key);
    if (exactElement?.isConnected) return exactElement;

    // 예외적으로 message.id가 비어 있거나 DOM id가 달라진 경우에만 v-for 순서를 사용합니다.
    // 매 메시지마다 querySelector를 다시 수행하지 않고, 한 번 수집한 DOM 배열에서만 조회합니다.
    const fallbackElement = domIndex.messageElements[index];
    if (
      fallbackElement?.isConnected &&
      String(fallbackElement.getAttribute("data-message-role") || "") ===
        String(message?.role || "")
    ) {
      return fallbackElement;
    }

    return null;
  }

  function hasRenderedMarkdownElement(element, selector) {
    const target = element?.querySelector?.(selector);
    if (!target) return false;

    // AssistantMessage는 최초 mount 시점에 빈 placeholder DOM이 먼저 존재할 수 있습니다.
    // Android 최초 진입에서는 이 placeholder를 실제 Markdown 완료로 오판하면
    // Mermaid target이 생성되기 전에 history render가 끝나므로, 명시적인 완료 플래그를 우선 확인합니다.
    if (target.getAttribute("data-markdown-rendered") !== "true") {
      return false;
    }

    return target.childNodes.length > 0 || target.textContent.trim().length > 0;
  }

  function getExpectedHistoryRenderMermaidCount() {
    if (!isMermaidRenderingEnabled()) return 0;
    return (props.messages || []).reduce((count, message) => {
      if (
        !message ||
        message.role !== "assistant" ||
        isAssistantErrorMessage(message)
      ) {
        return count;
      }

      return (
        count +
        countMermaidBlocksInText(message.content) +
        countMermaidBlocksInText(message.reasoningContent)
      );
    }, 0);
  }

  function isHistoryRenderMermaidDomReady(root = scrollRef.value) {
    const expectedCount = getExpectedHistoryRenderMermaidCount();
    if (expectedCount <= 0) return true;
    if (!root?.isConnected) return false;

    const mermaidNodes = root.querySelectorAll(
      ".md-mermaid[data-mermaid-pending], .md-mermaid[data-processed], .md-mermaid[data-mermaid-error]"
    );
    return mermaidNodes.length >= expectedCount;
  }

  function isHistoryRenderMessageMarkdownReady(domIndex, index) {
    const message = domIndex?.messages?.[index];
    if (!message) return false;

    const element = getHistoryRenderMessageElementFromIndex(
      domIndex,
      message,
      index
    );
    if (!element?.isConnected) return false;

    if (message?.role !== "assistant" || isAssistantErrorMessage(message)) {
      return true;
    }

    if (message?.reasoningContent) {
      if (
        !hasRenderedMarkdownElement(element, ".reasoning-content.markdown-body")
      ) {
        return false;
      }
    }

    if (message?.content) {
      if (
        !hasRenderedMarkdownElement(element, ".bubble-content.markdown-body")
      ) {
        return false;
      }
    }

    return true;
  }

  function isHistoryRenderContentReady(
    domIndex = createHistoryRenderDomIndex()
  ) {
    const {messages} = domIndex;
    for (let index = 0; index < messages.length; index += 1) {
      if (!isHistoryRenderMessageMarkdownReady(domIndex, index)) {
        return false;
      }
    }
    return true;
  }

  function getProgressiveInitialReadyMessageIndexes(domIndex) {
    const messages = domIndex?.messages || [];
    if (!messages.length) return [];

    const target = props.messageRenderPolicy?.scrollTarget || {
      type: MESSAGE_SCROLL_TARGET_TYPES.bottom,
    };

    if (target.type === MESSAGE_SCROLL_TARGET_TYPES.first) {
      return [0];
    }

    if (target.type === MESSAGE_SCROLL_TARGET_TYPES.message) {
      const messageId = String(target.messageId || "").trim();
      const targetIndex = messages.findIndex(
        (message, index) =>
          String(message?.id || "") === messageId ||
          getHistoryRenderMessageKey(message, index) === messageId
      );
      return targetIndex >= 0 ? [targetIndex] : [];
    }

    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (messages[index]?.role === "assistant") return [index];
    }
    return [messages.length - 1];
  }

  function isHistoryRenderRootLayoutReady(root) {
    if (!root?.isConnected) return false;

    const scrollElement = getScrollElement();
    const layoutTarget = scrollElement || root;
    const rect = layoutTarget.getBoundingClientRect?.();

    return Boolean(
      rect &&
      rect.width > 0 &&
      rect.height > 0 &&
      layoutTarget.clientWidth > 0 &&
      layoutTarget.clientHeight > 0
    );
  }

  function isHistoryRenderBaseReady(domIndex = createHistoryRenderDomIndex()) {
    const {root} = domIndex;
    if (!root?.isConnected) return false;
    if (!isHistoryRenderRootLayoutReady(root)) return false;
    if (!props.historyMessagesReady) return false;
    return true;
  }

  function isProgressiveHistoryRenderInitialReady(
    domIndex = createHistoryRenderDomIndex()
  ) {
    if (!isHistoryRenderBaseReady(domIndex)) return false;

    const indexes = getProgressiveInitialReadyMessageIndexes(domIndex);
    if (!indexes.length) return true;

    return indexes.every((index) =>
      isHistoryRenderMessageMarkdownReady(domIndex, index)
    );
  }

  function isHistoryRenderDomReady(domIndex = createHistoryRenderDomIndex()) {
    const {root, messages, messageElements} = domIndex;
    if (!root?.isConnected) return false;
    if (!isHistoryRenderRootLayoutReady(root)) return false;
    if (!props.historyMessagesReady) return false;
    if (messageElements.length < messages.length) return false;

    for (let index = 0; index < messages.length; index += 1) {
      if (
        !getHistoryRenderMessageElementFromIndex(
          domIndex,
          messages[index],
          index
        )?.isConnected
      ) {
        return false;
      }
    }

    return true;
  }

  function isHistoryRenderMarkdownReady(
    domIndex = createHistoryRenderDomIndex()
  ) {
    return (
      isHistoryRenderDomReady(domIndex) && isHistoryRenderContentReady(domIndex)
    );
  }

  function isHistoryRenderPostProcessReady(
    domIndex = createHistoryRenderDomIndex()
  ) {
    return (
      isHistoryRenderMarkdownReady(domIndex) &&
      isHistoryRenderMermaidDomReady(domIndex.root)
    );
  }

  function getPendingHistoryRenderMermaidTargets(root = scrollRef.value) {
    if (!isMermaidRenderingEnabled()) return [];
    if (!root?.isConnected) return [];
    return Array.from(
      root.querySelectorAll('.md-mermaid[data-mermaid-pending="true"]')
    ).filter((target) => target.isConnected);
  }

  return {
    createHistoryRenderDomIndex,
    getPendingHistoryRenderMermaidTargets,
    isHistoryRenderPostProcessReady,
    isProgressiveHistoryRenderInitialReady,
  };
}
