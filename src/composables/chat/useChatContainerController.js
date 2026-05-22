import {computed, onBeforeUnmount, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {useChatRuntime} from "@/composables/chat/useChatRuntime";
import {useChatDataController} from "@/composables/chat/container/useChatDataController";
import {useChatUIController} from "@/composables/chat/container/useChatUIController";

export function useChatContainerController(props) {
  const route = useRoute();
  const runtime = useChatRuntime();
  const messages = ref([]);
  const currentMode = computed(() => props.mode);
  const pageState = {
    currentMode,
    isMainPage: computed(() => currentMode.value === "main"),
    isChatPage: computed(() => currentMode.value === "chat"),
    isSharedPage: computed(() => currentMode.value === "shared"),
    isConversationPage: computed(() => currentMode.value !== "main"),
    isReadOnly: computed(() => currentMode.value === "shared"),
  };
  const activeHistoryId = computed(() => {
    if (pageState.isChatPage.value) return route.params.id;
    if (pageState.isSharedPage.value) return route.params.shareId;
    return null;
  });

  const ui = useChatUIController({
    messages,
    runtime,
    pageState,
    activeHistoryId,
  });

  const data = useChatDataController({props, ui, runtime, messages});

  watch(data.isMainPage, ui.updateMobileState);
  watch(() => data.isConversationPage.value, ui.updateMobileState);
  ui.bindUiEvents();
  data.bindDataEvents();
  data.initializeDataController();

  onBeforeUnmount(() => {
    ui.cleanupUiController();
  });

  return {
    t: ui.t,
    runtimeReady: data.runtimeReady,
    workspaceRef: ui.workspaceRef,
    assistants: data.assistants,
    currentAssistant: data.currentAssistant,
    models: data.models,
    selectedAssistantId: data.selectedAssistantId,
    selectedModel: data.selectedModel,
    isModelLocked: data.isModelLocked,
    isActiveModelUnavailable: data.isActiveModelUnavailable,
    messages: data.messages,
    showScrollBottom: ui.showScrollBottom,
    assistantSheetOpen: ui.assistantSheetOpen,
    noticeOpen: ui.noticeOpen,
    privacyOpen: ui.privacyOpen,
    personalizationOpen: ui.personalizationOpen,
    systemOpen: ui.systemOpen,
    languageSheetOpen: ui.languageSheetOpen,
    mobileSettingsOpen: ui.mobileSettingsOpen,
    historyDialogOpen: ui.historyDialogOpen,
    historyDialogMode: ui.historyDialogMode,
    historyDialogTarget: ui.historyDialogTarget,
    historyDialogTitle: ui.historyDialogTitle,
    historyDialogMessage: ui.historyDialogMessage,
    historyNoticeOpen: ui.historyNoticeOpen,
    historyNoticeMessage: ui.historyNoticeMessage,
    previewImage: ui.previewImage,
    themeName: ui.themeName,
    isMobile: ui.isMobile,
    layoutKeyboardOpen: ui.layoutKeyboardOpen,
    isReadOnly: data.isReadOnly,
    activeConversationTitle: data.activeConversationTitle,
    workspaceAssistantLabel: data.workspaceAssistantLabel,
    suggestions: data.suggestions,
    isGenerating: data.isGenerating,
    autoScrollOnAnswer: ui.autoScrollOnAnswer,
    closeImagePreview: ui.closeImagePreview,
    handlePreviewLoad: ui.handlePreviewLoad,
    handlePreviewError: ui.handlePreviewError,
    startNewChatWithAssistant: ui.startNewChatWithAssistant,
    startNewChat: ui.startNewChat,
    openHistory: ui.openHistory,
    handleHistoryMenuAction: ui.handleHistoryMenuAction,
    closeHistoryDialog: ui.closeHistoryDialog,
    confirmHistoryDialog: ui.confirmHistoryDialog,
    openMobileDrawer: ui.openMobileDrawer,
    toggleTheme: ui.toggleTheme,
    openSwagger: ui.openSwagger,
    openPlayground: ui.openPlayground,
    openSettings: ui.openSettings,
    openGuide: ui.openGuide,
    openNotice: ui.openNotice,
    openPrivacy: ui.openPrivacy,
    openTerms: ui.openTerms,
    openPersonalization: ui.openPersonalization,
    openSystem: ui.openSystem,
    openLanguage: ui.openLanguage,
    openAssistantFromHeader: ui.openAssistantFromHeader,
    logout: ui.logout,
    submitIfWritable: data.submitIfWritable,
    regenerateIfWritable: data.regenerateIfWritable,
    handlePromptFocus: ui.handlePromptFocus,
    handlePromptResize: ui.handlePromptResize,
    handleMessageContentRendered: ui.handleMessageContentRendered,
    scrollBottom: ui.scrollBottom,
    handleSystemSettingsApplied: ui.handleSystemSettingsApplied,
  };
}
