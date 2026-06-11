import {computed} from "vue";
import {useChatStore} from "@/stores/chatStore";
import {
  provideChatActions,
  provideChatWorkspaceState,
  providePromptState,
  provideWorkspaceActions,
} from "@/composables/chat/context/useChatProvider";

export function useChatContainerProviders({
  routeMode,
  isReadOnly,
  isMobile,
  workspaceAssistantLabel,
  currentAssistant,
  activeConversationTitle,
  themeName,
  suggestions,
  isActiveModelUnavailable,
  isGenerating,
  messages,
  showScrollBottom,
  autoScrollOnAnswer,
  isHistoryRendering,
  historyMarkdownVisible,
  historyMessagesLoaded,
  hasPreviousHistoryMessages,
  historyLazyTopThreshold,
  historyLazyChunkSize,
  messageRenderPolicy,
  pcHistoryLazyInitialCount,
  pcHistoryLazyAppendCount,
  pcHistoryLazyTopThresholdPx,
  mobileHistoryLazyInitialCount,
  mobileHistoryLazyAppendCount,
  selectedModel,
  models,
  isModelLocked,
  chatPageLock,
  handleHistoryMenuAction,
  submit,
  regenerate,
  refreshPromptViewport,
  handleMessageContentRendered,
  scrollBottom,
  finishHistoryRender,
  revealHistoryMarkdown,
  loadPreviousHistoryMessages,
  openStudioDetail,
}) {
  const chatStore = useChatStore();

  provideChatActions({
    historyMenuAction: handleHistoryMenuAction,
  });

  provideChatWorkspaceState(
    computed(() => ({
      mode: routeMode.value,
      readonly: isReadOnly.value,
      isMobile: isMobile.value,
      assistantLabel: workspaceAssistantLabel.value,
      assistant: currentAssistant.value,
      conversationTitle: activeConversationTitle.value,
      themeName: themeName.value,
      suggestions: suggestions.value,
      isActiveModelDeleted: Boolean(chatStore.activeSession?.isModelDeleted),
      isActiveModelUnavailable: isActiveModelUnavailable.value,
      isGenerating: isGenerating.value,
      messages: messages.value,
      showScrollBottom: showScrollBottom.value,
      autoScrollOnAnswer: autoScrollOnAnswer.value,
      isHistoryRendering: isHistoryRendering.value,
      historyMarkdownVisible: historyMarkdownVisible.value,
      historyMessagesLoaded: historyMessagesLoaded.value,
      hasPreviousHistoryMessages: hasPreviousHistoryMessages.value,
      historyLazyTopThreshold: historyLazyTopThreshold.value,
      historyLazyChunkSize: historyLazyChunkSize.value,
      messageRenderPolicy: messageRenderPolicy.value,
      pcHistoryLazyInitialCount: pcHistoryLazyInitialCount.value,
      pcHistoryLazyAppendCount: pcHistoryLazyAppendCount.value,
      pcHistoryLazyTopThresholdPx: pcHistoryLazyTopThresholdPx.value,
      mobileHistoryLazyInitialCount: mobileHistoryLazyInitialCount.value,
      mobileHistoryLazyAppendCount: mobileHistoryLazyAppendCount.value,
    }))
  );

  providePromptState(
    computed(() => ({
      isMobile: isMobile.value,
      floating: false,
      showHelp: false,
      selectedModel: selectedModel.value,
      models: models.value,
      disabled: isReadOnly.value,
      generating: isGenerating.value,
      modelReadonly: isModelLocked.value,
      placeholder: "",
    }))
  );

  provideWorkspaceActions({
    submit: (payload) => {
      if (chatPageLock.isSubmitBlocked.value) return;
      submit(payload);
    },
    regenerate: (message) => {
      if (chatPageLock.isRegenerateBlocked.value) return;
      regenerate(message);
    },
    updateSelectedModel: (val) => {
      selectedModel.value = val;
    },
    handlePromptFocus: refreshPromptViewport,
    handlePromptResize: refreshPromptViewport,
    handleMessageContentRendered,
    scrollBottom: () => {
      scrollBottom({force: true, behavior: "smooth", stable: true});
    },
    handleHistoryRendered: finishHistoryRender,
    handleHistoryMarkdownRendered: revealHistoryMarkdown,
    loadPreviousHistoryMessages,
    openStudioDetail,
  });
}
