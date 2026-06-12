import {computed, nextTick, ref} from "vue";
import {
  resolveInitialMessageLazyRange,
  resolveMessageLazySettings,
  resolvePreviousMessageLazyStart,
} from "@/composables/chat/message-list/useMessageLazyRange";
import {
  HISTORY_RENDER_STRATEGIES,
  MESSAGE_SCROLL_TARGET_TYPES,
} from "@/composables/chat/message-list/useMessageRenderPolicy";

function waitAnimationFrame() {
  if (typeof window === "undefined") return Promise.resolve();
  return new Promise((resolve) => window.requestAnimationFrame(resolve));
}

function normalizeMessageId(value) {
  const id = String(value || "").trim();
  return id || null;
}

function findMessageIndexById(messages = [], messageId) {
  const targetId = normalizeMessageId(messageId);
  if (!targetId) return -1;

  return messages.findIndex(
    (message) => String(message?.id || "") === targetId
  );
}

function clampRangeStart(start, count, length) {
  if (length <= 0) return 0;
  const normalizedCount = Math.max(1, Math.min(count, length));
  return Math.max(0, Math.min(start, length - normalizedCount));
}

export function useConversationLazyHistory({
  messages,
  isChatPage,
  activeHistoryId,
  messageRenderPolicy,
  systemSettingsStore,
  isMobile,
  setMessages,
  appendUserAndAssistantMessages,
}) {
  const fullHistoryMessages = ref([]);
  const historyVisibleStartIndex = ref(0);
  const progressiveInitialHistoryState = ref(null);
  let progressiveInitialHistoryToken = 0;
  let progressiveInitialHistoryRunning = false;

  function cancelProgressiveInitialHistoryRender() {
    progressiveInitialHistoryToken += 1;
    progressiveInitialHistoryRunning = false;
    progressiveInitialHistoryState.value = null;
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

  function getHistoryRenderStrategy() {
    return String(messageRenderPolicy.value?.historyRenderStrategy || "");
  }

  function isPcProgressiveHistoryRender() {
    return getHistoryRenderStrategy().startsWith("pc-progressive-");
  }

  function createProgressiveInitialHistoryState(list = []) {
    if (!isPcProgressiveHistoryRender()) return null;
    if (!Array.isArray(list) || !list.length) return null;

    const strategy = getHistoryRenderStrategy();
    const appendCount = Math.max(1, getHistoryLazyAppendCount());
    const initialCount = Math.max(1, getHistoryLazyInitialCount());
    const target = messageRenderPolicy.value?.scrollTarget || {};
    const chunkCount = Math.min(appendCount, list.length);

    if (strategy === HISTORY_RENDER_STRATEGIES.pcProgressiveShared) {
      const end = Math.min(chunkCount, list.length);
      return {
        mode: "forward",
        start: 0,
        end,
        nextAfter: end,
        finalStart: 0,
        finalEnd: list.length,
        chunkSize: appendCount,
      };
    }

    if (strategy === HISTORY_RENDER_STRATEGIES.pcProgressiveSearch) {
      const targetIndex = findMessageIndexById(list, target.messageId);
      if (targetIndex < 0) return null;

      const start = clampRangeStart(
        targetIndex - Math.floor(chunkCount / 2),
        chunkCount,
        list.length
      );
      const end = Math.min(start + chunkCount, list.length);
      return {
        mode: "target-window",
        start,
        end,
        nextBefore: start,
        nextAfter: end,
        finalStart: 0,
        finalEnd: list.length,
        chunkSize: appendCount,
        growForwardNext: true,
      };
    }

    if (
      strategy === HISTORY_RENDER_STRATEGIES.pcProgressiveNormal &&
      target.type === MESSAGE_SCROLL_TARGET_TYPES.bottom
    ) {
      const finalCount = Math.min(initialCount, list.length);
      const finalStart = Math.max(list.length - finalCount, 0);
      const start = Math.max(list.length - Math.min(chunkCount, finalCount), 0);
      return {
        mode: "backward",
        start,
        end: list.length,
        nextBefore: start,
        finalStart,
        finalEnd: list.length,
        chunkSize: appendCount,
      };
    }

    return null;
  }

  function applyProgressiveInitialWindow(state) {
    if (!state) return false;
    const list = Array.isArray(fullHistoryMessages.value)
      ? fullHistoryMessages.value
      : [];
    const start = Math.max(0, state.start || 0);
    const end = Math.min(list.length, Math.max(start, state.end || 0));
    historyVisibleStartIndex.value = start;
    messages.value = list.slice(start, end);
    return true;
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

    const progressiveState = createProgressiveInitialHistoryState(list);
    if (progressiveState && applyProgressiveInitialWindow(progressiveState)) {
      progressiveInitialHistoryToken += 1;
      progressiveInitialHistoryState.value = progressiveState;
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

  function expandProgressiveStateForward(state) {
    if (state.nextAfter >= state.finalEnd) return false;
    state.end = Math.min(state.nextAfter + state.chunkSize, state.finalEnd);
    state.nextAfter = state.end;
    return true;
  }

  function expandProgressiveStateBackward(state) {
    if (state.nextBefore <= state.finalStart) return false;
    state.start = Math.max(state.nextBefore - state.chunkSize, state.finalStart);
    state.nextBefore = state.start;
    return true;
  }

  function expandProgressiveStateTargetWindow(state) {
    if (state.growForwardNext && expandProgressiveStateForward(state)) {
      state.growForwardNext = false;
      return true;
    }
    if (expandProgressiveStateBackward(state)) {
      state.growForwardNext = true;
      return true;
    }
    if (expandProgressiveStateForward(state)) {
      state.growForwardNext = false;
      return true;
    }
    return false;
  }

  function expandProgressiveInitialState(state, list) {
    if (!state || !Array.isArray(list) || !list.length) return false;
    if (state.mode === "forward") return expandProgressiveStateForward(state);
    if (state.mode === "backward") return expandProgressiveStateBackward(state);
    if (state.mode === "target-window") {
      return expandProgressiveStateTargetWindow(state);
    }
    return false;
  }

  async function continueProgressiveInitialHistoryRender() {
    const state = progressiveInitialHistoryState.value;
    if (!state || progressiveInitialHistoryRunning) return false;

    const token = progressiveInitialHistoryToken;
    progressiveInitialHistoryRunning = true;

    try {
      const list = Array.isArray(fullHistoryMessages.value)
        ? fullHistoryMessages.value
        : [];
      while (
        token === progressiveInitialHistoryToken &&
        progressiveInitialHistoryState.value &&
        expandProgressiveInitialState(state, list)
      ) {
        applyProgressiveInitialWindow(state);
        await nextTick();
        await waitAnimationFrame();
      }

      if (token === progressiveInitialHistoryToken) {
        progressiveInitialHistoryState.value = null;
      }
      return true;
    } finally {
      if (token === progressiveInitialHistoryToken) {
        progressiveInitialHistoryRunning = false;
      }
    }
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
