import {computed, ref, watch} from "vue";
import {useEventListener} from "@vueuse/core";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useAppContext} from "@/composables/app/useAppContext";
import {useAutoScroll} from "@/composables/chat/useAutoScroll";
import {useImagePreview} from "@/composables/chat/useImagePreview";
import {useViewportGuard} from "@/platform/viewport/useViewportGuard";
import {useNavigationStore} from "@/stores/navigationStore";
import {usePlatformStore} from "@/stores/platformStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {useViewportStore} from "@/platform/viewport/viewportStore";
import {syncViewportSettings} from "@/utils/viewportSettingsSync";
import {useChatHistoryDialog} from "@/composables/chat/container/useChatHistoryDialog";
import {useChatMobileState} from "@/composables/chat/container/useChatMobileState";
import {useChatNavigationActions} from "@/composables/chat/container/useChatNavigationActions";
import {useChatPromptActions} from "@/composables/chat/container/useChatPromptActions";
import {useChatScrollController} from "@/composables/chat/container/useChatScrollController";

export function useChatUIController({
  messages,
  runtime,
  pageState,
  activeHistoryId,
}) {
  const {t} = useI18n();
  const router = useRouter();
  const {theme} = useAppContext();
  const navigationStore = useNavigationStore();
  const platformStore = usePlatformStore();
  const systemSettingsStore = useSystemSettingsStore();
  const viewportStore = useViewportStore();
  syncViewportSettings(systemSettingsStore.mobileBreakpoint);

  const {scrollToBottom} = useAutoScroll({value: null});
  const workspaceRef = ref(null);
  const themeName = ref(theme.current);
  const assistantSheetOpen = ref(false);
  const noticeOpen = ref(false);
  const privacyOpen = ref(false);
  const personalizationOpen = ref(false);
  const systemOpen = ref(false);
  const languageSheetOpen = ref(false);
  const mobileSettingsOpen = ref(false);
  const autoScrollOnAnswer = computed(
    () => systemSettingsStore.autoScrollOnAnswer
  );

  const {
    previewImage,
    closeImagePreview,
    handlePreviewLoad,
    handlePreviewError,
  } = useImagePreview();

  const isCompactScreen = computed(() => viewportStore.isCompact);
  const platformInfo = computed(() => platformStore.info || {});
  const {isMobile, updateMobileState} = useChatMobileState({
    isCompactScreen,
    platformInfo,
  });

  const {
    showScrollBottom,
    markForceBottom,
    clearForceBottom,
    scrollBottom,
    scrollLatestUserMessage,
    scheduleBottomStateCheck,
    handleMessageContentRendered,
    cleanupScrollController,
  } = useChatScrollController({
    isConversationPage: pageState.isConversationPage,
    workspaceRef,
    scrollToBottom,
    autoScrollEnabled: autoScrollOnAnswer,
  });

  const {keyboardOpen, refreshViewport} = useViewportGuard({
    onChange: () => {
      // Keyboard/focus viewport changes must not force scroll.
      // Submit-time question scrolling is owned by useChatSubmit.
    },
  });

  const layoutKeyboardOpen = computed(
    () => !pageState.isMainPage.value && keyboardOpen.value
  );

  const {
    historyDialogOpen,
    historyDialogMode,
    historyDialogTarget,
    historyDialogTitle,
    historyDialogMessage,
    historyNoticeOpen,
    historyNoticeMessage,
    closeHistoryDialog,
    confirmHistoryDialog,
    handleHistoryMenuAction,
  } = useChatHistoryDialog({
    t,
    router,
    messages,
    activeHistoryId,
    toggleHistoryBookmark: runtime.toggleHistoryBookmark,
    renameHistory: runtime.renameHistory,
    removeHistory: runtime.removeHistory,
    syncHistoriesInBackground: runtime.syncHistoriesInBackground,
  });

  const {handlePromptFocus, handlePromptResize} = useChatPromptActions({
    isReadOnly: pageState.isReadOnly,
    isActiveModelUnavailable: runtime.isActiveModelUnavailable,
    refreshViewport,
  });

  const navigationActions = useChatNavigationActions({
    router,
    theme,
    themeName,
    messages,
    isMobile,
    assistantSheetOpen,
    noticeOpen,
    privacyOpen,
    personalizationOpen,
    systemOpen,
    languageSheetOpen,
    mobileSettingsOpen,
    navigationStore,
    revokeMessageAttachments: runtime.revokeMessageAttachments,
    clearCurrentChatSelection: runtime.clearCurrentChatSelection,
    selectAssistantForNewChat: runtime.selectAssistantForNewChat,
    refreshViewport,
    clearForceBottom,
    scrollBottom,
  });


  watch(
    () => systemSettingsStore.mobileBreakpoint,
    (breakpoint) => {
      syncViewportSettings(breakpoint);
      refreshViewport();
      updateMobileState();
    }
  );

  function bindUiEvents() {
    useEventListener(window, "resize", updateMobileState, {passive: true});
    useEventListener(window, "scroll", scheduleBottomStateCheck, {
      capture: true,
      passive: true,
    });
  }

  function handleSystemSettingsApplied() {
    syncViewportSettings(systemSettingsStore.mobileBreakpoint);
    refreshViewport();
    updateMobileState();
    scrollBottom({stable: true});
  }

  function cleanupUiController() {
    cleanupScrollController();
    runtime.revokeMessageAttachments(messages.value);
  }

  return {
    t,
    workspaceRef,
    assistantSheetOpen,
    noticeOpen,
    privacyOpen,
    personalizationOpen,
    systemOpen,
    languageSheetOpen,
    mobileSettingsOpen,
    previewImage,
    themeName,
    isMobile,
    layoutKeyboardOpen,
    showScrollBottom,
    autoScrollOnAnswer,
    historyDialogOpen,
    historyDialogMode,
    historyDialogTarget,
    historyDialogTitle,
    historyDialogMessage,
    historyNoticeOpen,
    historyNoticeMessage,
    closeImagePreview,
    handlePreviewLoad,
    handlePreviewError,
    closeHistoryDialog,
    confirmHistoryDialog,
    handleHistoryMenuAction,
    handlePromptFocus,
    handlePromptResize,
    handleMessageContentRendered,
    markForceBottom,
    clearForceBottom,
    scrollBottom,
    scrollLatestUserMessage,
    refreshViewport,
    updateMobileState,
    bindUiEvents,
    handleSystemSettingsApplied,
    cleanupUiController,
    ...navigationActions,
  };
}
