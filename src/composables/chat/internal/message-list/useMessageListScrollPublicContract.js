export const MESSAGE_LIST_SCROLL_PUBLIC_CONTRACT_KEYS = Object.freeze([
  "scrollRef",
  "bottomRef",
  "streamFocusSpacerHeight",
  "androidManualHistoryLoadMode",
  "previousHistoryLoadInProgress",
  "handleScroll",
  "handleUserScrollIntent",
  "handleManualPreviousHistoryLoad",
  "handleMessageRendered",
  "scrollToBottom",
  "scrollToBottomAfterRender",
  "scrollToInitialTarget",
  "scrollToLatestUserMessage",
  "getIsAtBottom",
  "getScrollElement",
]);

export function createMessageListScrollPublicContract(contract) {
  return {
    scrollRef: contract.scrollRef,
    bottomRef: contract.bottomRef,
    streamFocusSpacerHeight: contract.streamFocusSpacerHeight,
    androidManualHistoryLoadMode: contract.androidManualHistoryLoadMode,
    previousHistoryLoadInProgress: contract.previousHistoryLoadInProgress,
    handleScroll: contract.handleScroll,
    handleUserScrollIntent: contract.handleUserScrollIntent,
    handleManualPreviousHistoryLoad: contract.handleManualPreviousHistoryLoad,
    handleMessageRendered: contract.handleMessageRendered,
    scrollToBottom: contract.scrollToBottom,
    scrollToBottomAfterRender: contract.scrollToBottomAfterRender,
    scrollToInitialTarget: contract.scrollToInitialTarget,
    scrollToLatestUserMessage: contract.scrollToLatestUserMessage,
    getIsAtBottom: contract.getIsAtBottom,
    getScrollElement: contract.getScrollElement,
  };
}
