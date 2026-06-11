import {computed, nextTick, ref} from "vue";
import {
  resolveInitialMessageLazyRange,
  resolveMessageLazySettings,
  resolvePreviousMessageLazyStart,
} from "@/composables/chat/message-list/useMessageLazyRange";

export function useConversationLazyHistory({
  messages,
  isChatPage,
  activeHistoryId,
  messageRenderPolicy,
  systemSettingsStore,
  isMobile,
  setMessages,
  appendUserAndAssistantMessages,
  isHistoryRendering = {value: false},
  onProgressiveInitialChunkRendered,
}) {
  const fullHistoryMessages = ref([]);
  const historyVisibleStartIndex = ref(0);
  const progressiveInitialTargetStartIndex = ref(0);
  let progressiveInitialRenderSeq = 0;
  let progressiveInitialRenderRunning = false;


  function waitForProgressiveInitialFrame() {
    if (typeof window === "undefined") return Promise.resolve();
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }

  function cancelProgressiveInitialHistoryRender() {
    progressiveInitialRenderSeq += 1;
    progressiveInitialRenderRunning = false;
    progressiveInitialTargetStartIndex.value = 0;
  }

  function isPcProgressiveNormalHistoryRender() {
    return (
      messageRenderPolicy.value?.historyRenderStrategy ===
        "pc-progressive-normal"
    );
  }

  function shouldUseProgressiveInitialHistoryRender() {
    return (
      isHistoryRendering.value === true &&
      isChatPage.value &&
      messageRenderPolicy.value.useLazyLoading !== false &&
      isPcProgressiveNormalHistoryRender()
    );
  }

  function getMessageLazySettings() {
    return resolveMessageLazySettings(
      systemSettingsStore.settings,
      Boolean(isMobile?.value)
    );
  }

  function getHistoryLazyInitialCount() {
    return getMessageLazySettings().initialCount;
  }

  function getHistoryLazyAppendCount() {
    return getMessageLazySettings().appendCount;
  }

  function getHistoryLazyTopThresholdPx() {
    return getMessageLazySettings().topThresholdPx;
  }

  const hasPreviousHistoryMessages = computed(
    () =>
      isChatPage.value &&
      messageRenderPolicy.value.useLazyLoading !== false &&
      historyVisibleStartIndex.value > 0
  );

  function clearLazyHistoryMessages() {
    cancelProgressiveInitialHistoryRender();
    fullHistoryMessages.value = [];
    historyVisibleStartIndex.value = 0;
  }

  function getInitialLazyHistorySlice(sourceMessages = []) {
    const list = Array.isArray(sourceMessages) ? sourceMessages : [];
    return resolveInitialMessageLazyRange({
      messages: list,
      initialCount: getHistoryLazyInitialCount(),
      useLazyLoading: messageRenderPolicy.value.useLazyLoading !== false,
    });
  }

  function setHistoryMessagesForInitialRender(sourceMessages = []) {
    cancelProgressiveInitialHistoryRender();

    const list = Array.isArray(sourceMessages) ? sourceMessages : [];
    fullHistoryMessages.value = list;

    if (shouldUseProgressiveInitialHistoryRender()) {
      const initialCount = Math.min(getHistoryLazyInitialCount(), list.length);
      const firstCount = Math.min(getHistoryLazyAppendCount(), initialCount);
      const targetStart = Math.max(list.length - initialCount, 0);
      const firstStart = Math.max(list.length - firstCount, targetStart);

      progressiveInitialTargetStartIndex.value = targetStart;
      historyVisibleStartIndex.value = firstStart;
      messages.value = list.slice(firstStart);
      return;
    }

    const {start, visibleMessages} = getInitialLazyHistorySlice(list);
    historyVisibleStartIndex.value = start;
    messages.value = visibleMessages;
  }

  function syncVisibleHistoryMessagesFromFull(sourceMessages = []) {
    const list = Array.isArray(sourceMessages) ? sourceMessages : [];
    if (messageRenderPolicy.value.useLazyLoading === false) {
      fullHistoryMessages.value = list;
      historyVisibleStartIndex.value = 0;
      messages.value = list;
      return true;
    }

    if (!isChatPage.value || !fullHistoryMessages.value.length) {
      fullHistoryMessages.value = list;
      return false;
    }

    const currentVisibleCount = Math.max(
      messages.value.length,
      Math.min(getHistoryLazyInitialCount(), list.length)
    );
    const isShowingLatest =
      historyVisibleStartIndex.value + messages.value.length >=
      fullHistoryMessages.value.length;

    fullHistoryMessages.value = list;

    if (isShowingLatest) {
      const count = Math.max(currentVisibleCount, getHistoryLazyInitialCount());
      historyVisibleStartIndex.value = Math.max(list.length - count, 0);
    } else {
      historyVisibleStartIndex.value = Math.min(
        historyVisibleStartIndex.value,
        Math.max(list.length - 1, 0)
      );
    }

    const end = isShowingLatest
      ? list.length
      : Math.min(
          historyVisibleStartIndex.value + currentVisibleCount,
          list.length
        );
    messages.value = list.slice(historyVisibleStartIndex.value, end);
    return true;
  }

  function loadPreviousHistoryMessages() {
    if (!isChatPage.value) return false;
    if (messageRenderPolicy.value.useLazyLoading === false) return false;
    const list = fullHistoryMessages.value;
    if (!Array.isArray(list) || !list.length) return false;
    if (historyVisibleStartIndex.value <= 0) return false;

    const previousStart = historyVisibleStartIndex.value;
    const nextStart = resolvePreviousMessageLazyStart({
      currentStart: previousStart,
      appendCount: getHistoryLazyAppendCount(),
    });
    if (nextStart === previousStart) return false;

    historyVisibleStartIndex.value = nextStart;
    messages.value = list.slice(nextStart);
    return true;
  }

  function isLazyHistoryActiveForChat(chatId) {
    return (
      messageRenderPolicy.value.useLazyLoading !== false &&
      isChatPage.value &&
      String(activeHistoryId.value || "") === String(chatId || "") &&
      Array.isArray(fullHistoryMessages.value) &&
      fullHistoryMessages.value.length > 0
    );
  }

  function mergeVisibleMessagesIntoFullHistory(nextVisibleMessages = []) {
    const existing = Array.isArray(fullHistoryMessages.value)
      ? fullHistoryMessages.value
      : [];
    const start = Math.max(0, historyVisibleStartIndex.value);
    const visible = Array.isArray(nextVisibleMessages)
      ? nextVisibleMessages
      : [];

    const merged = [...existing.slice(0, start), ...visible];
    fullHistoryMessages.value = merged;
    messages.value = visible;
    return merged;
  }

  function setConversationPreservingLazyHistory(chatId, nextMessages) {
    if (isLazyHistoryActiveForChat(chatId)) {
      const merged = mergeVisibleMessagesIntoFullHistory(nextMessages);
      setMessages(chatId, merged);
      return;
    }

    setMessages(chatId, nextMessages);
  }

  function appendUserAndAssistantMessagesPreservingLazyHistory(
    chatId,
    normalized
  ) {
    const result = appendUserAndAssistantMessages(chatId, normalized);

    if (!isLazyHistoryActiveForChat(chatId)) {
      return result;
    }

    fullHistoryMessages.value = Array.isArray(result.messages)
      ? result.messages
      : [];

    const visibleCount = Math.max(
      getHistoryLazyInitialCount(),
      Math.min(
        fullHistoryMessages.value.length,
        (messages.value?.length || 0) + 2
      )
    );
    historyVisibleStartIndex.value = Math.max(
      fullHistoryMessages.value.length - visibleCount,
      0
    );
    const visibleMessages = fullHistoryMessages.value.slice(
      historyVisibleStartIndex.value
    );
    messages.value = visibleMessages;

    return {
      messages: visibleMessages,
      assistantMessage: result.assistantMessage,
    };
  }


  async function continueProgressiveInitialHistoryRender() {
    if (!shouldUseProgressiveInitialHistoryRender()) return false;
    if (progressiveInitialRenderRunning) return false;

    const list = Array.isArray(fullHistoryMessages.value)
      ? fullHistoryMessages.value
      : [];
    if (!list.length) return false;

    const targetStart = Math.max(0, progressiveInitialTargetStartIndex.value);
    if (historyVisibleStartIndex.value <= targetStart) return false;

    const seq = ++progressiveInitialRenderSeq;
    progressiveInitialRenderRunning = true;

    try {
      while (
        seq === progressiveInitialRenderSeq &&
        shouldUseProgressiveInitialHistoryRender() &&
        historyVisibleStartIndex.value > targetStart
      ) {
        await waitForProgressiveInitialFrame();
        if (seq !== progressiveInitialRenderSeq) break;

        const previousStart = historyVisibleStartIndex.value;
        const nextStart = Math.max(
          targetStart,
          previousStart - getHistoryLazyAppendCount()
        );
        if (nextStart === previousStart) break;

        historyVisibleStartIndex.value = nextStart;
        messages.value = list.slice(nextStart);

        await nextTick();
        if (seq !== progressiveInitialRenderSeq) break;
        if (typeof onProgressiveInitialChunkRendered === "function") {
          await onProgressiveInitialChunkRendered();
        }

        await waitForProgressiveInitialFrame();
      }
    } finally {
      if (seq === progressiveInitialRenderSeq) {
        progressiveInitialRenderRunning = false;
      }
    }

    return true;
  }

  return {
    fullHistoryMessages,
    historyVisibleStartIndex,
    hasPreviousHistoryMessages,
    getHistoryLazyInitialCount,
    getHistoryLazyAppendCount,
    getHistoryLazyTopThresholdPx,
    clearLazyHistoryMessages,
    setHistoryMessagesForInitialRender,
    continueProgressiveInitialHistoryRender,
    syncVisibleHistoryMessagesFromFull,
    loadPreviousHistoryMessages,
    setConversationPreservingLazyHistory,
    appendUserAndAssistantMessagesPreservingLazyHistory,
  };
}
