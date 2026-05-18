import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useEventListener, useMediaQuery} from "@vueuse/core";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {useAppContext} from "@/composables/useAppContext";
import {useAutoScroll} from "@/composables/useAutoScroll";
import {useChatRuntime} from "@/composables/useChatRuntime";
import {useChatSubmit} from "@/composables/useChatSubmit";
import {useImagePreview} from "@/composables/useImagePreview";
import {loadSharedConversation} from "@/composables/useSharedChat";
import {useViewportGuard} from "@/composables/useViewportGuard";
import {useNavigationStore} from "@/stores/navigationStore";
import {usePlatformStore} from "@/stores/platformStore";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {logWarn} from "@/utils/logger";
import {PROMPT_SUGGESTION_LIMIT} from "@/constants/promptSuggestions";
import {MOBILE_BREAKPOINT_PX} from "@/constants/uiTokens";
import {useChatHistoryDialog} from "@/composables/chat/container/useChatHistoryDialog";
import {useChatMobileState} from "@/composables/chat/container/useChatMobileState";
import {useChatNavigationActions} from "@/composables/chat/container/useChatNavigationActions";
import {useChatPromptActions} from "@/composables/chat/container/useChatPromptActions";
import {useChatScrollController} from "@/composables/chat/container/useChatScrollController";

export function useChatContainerController(props) {
  const {t, locale} = useI18n();
  const router = useRouter();
  const route = useRoute();
  const {theme} = useAppContext();
  const runtime = useChatRuntime();
  const navigationStore = useNavigationStore();
  const platformStore = usePlatformStore();
  const {scrollToBottom} = useAutoScroll({value: null});

  const workspaceRef = ref(null);
  const themeName = ref(theme.current);
  const messages = ref([]);
  const assistantSheetOpen = ref(false);
  const noticeOpen = ref(false);
  const privacyOpen = ref(false);
  const personalizationOpen = ref(false);
  const languageSheetOpen = ref(false);
  const mobileSettingsOpen = ref(false);
  const runtimeReady = ref(false);

  const {
    assistants,
    currentAssistant,
    histories,
    models,
    selectedAssistantId,
    selectedModel,
    isModelLocked,
    isActiveModelUnavailable,
    activeSession,
    ensureConversation,
    setConversation,
    createLocalConversation,
    clearCurrentChatSelection,
    appendUserAndAssistantMessages,
    selectAssistantForNewChat,
    currentExamplePrompts,
    getHistory,
    revokeMessageAttachments,
    toggleHistoryBookmark,
    renameHistory,
    removeHistory,
  } = runtime;

  const {
    previewImage,
    closeImagePreview,
    handlePreviewLoad,
    handlePreviewError,
  } = useImagePreview();

  const isCompactScreen = useMediaQuery(
    `(max-width: ${MOBILE_BREAKPOINT_PX}px)`
  );
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
    scheduleBottomStateCheck,
    handleMessageContentRendered,
    cleanupScrollController,
  } = useChatScrollController({props, workspaceRef, scrollToBottom});

  const {keyboardOpen, refreshViewport} = useViewportGuard({
    onChange: ({isCompact, keyboardOpen: isKeyboardOpen}) => {
      if (props.mode !== "main" && isCompact && isKeyboardOpen) {
        scrollBottom({stable: true});
      }
    },
  });

  const layoutKeyboardOpen = computed(
    () => props.mode !== "main" && keyboardOpen.value
  );
  const isReadOnly = computed(() => props.mode === "shared");
  const activeHistoryId = computed(() => {
    if (props.mode === "chat") return route.params.id;
    if (props.mode === "shared") return route.params.shareId;
    return null;
  });
  const activeHistory = computed(() => getHistory(activeHistoryId.value));
  const activeConversationTitle = computed(() => {
    if (props.mode === "shared") {
      return t("chat.sharedConversationTitle", {
        id: activeHistoryId.value || "",
      }).trim();
    }
    return activeHistory.value?.title || "";
  });
  const workspaceAssistantLabel = computed(() => {
    if (activeSession.value?.displayAssistantLabel) {
      return activeSession.value.displayAssistantLabel;
    }
    if (
      activeSession.value?.assistantLabel &&
      !activeSession.value?.isModelUnavailable
    ) {
      return activeSession.value.assistantLabel;
    }
    return currentAssistant.value?.label || t("chat.assistant");
  });

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
    toggleHistoryBookmark,
    renameHistory,
    removeHistory,
  });

  const suggestions = computed(() => {
    const assistantPrompts = currentExamplePrompts.value || [];
    const isEnglish = locale.value === "en";

    return assistantPrompts
      .slice(0, PROMPT_SUGGESTION_LIMIT)
      .map((prompt) => {
        const localizedTitle = isEnglish
          ? prompt.titleEn || prompt.titleKo
          : prompt.titleKo || prompt.titleEn;
        const localizedContent = isEnglish
          ? prompt.contentEn || prompt.contentKo || localizedTitle
          : prompt.contentKo || prompt.contentEn || localizedTitle;
        const text = localizedTitle || localizedContent;
        const content = localizedContent || localizedTitle;

        return {
          id: prompt.id,
          text,
          title: content || text,
          prompt: content || text,
        };
      })
      .filter((item) => item.text && item.prompt);
  });

  const {handlePromptFocus, handlePromptResize} = useChatPromptActions({
    props,
    isReadOnly,
    isActiveModelUnavailable,
    isMobile,
    refreshViewport,
    scrollBottom,
  });

  async function loadRouteConversation() {
    if (props.mode === "main") {
      messages.value = [];
      clearCurrentChatSelection();
      return;
    }

    try {
      if (props.mode === "shared") {
        messages.value = await loadSharedConversation(activeHistoryId.value);
        markForceBottom();
        await nextTick();
        await scrollBottom({behavior: "auto", force: true, stable: true});
        return;
      }

      const history = getHistory(activeHistoryId.value);
      if (!history) {
        await router.replace("/").catch(() => {});
        return;
      }
      messages.value = await ensureConversation(history.id);
      markForceBottom();
      await nextTick();
      await scrollBottom({behavior: "auto", force: true, stable: true});
    } catch (error) {
      logWarn(
        "[useChatContainerController] loadRouteConversation 오류:",
        error
      );
    }
  }

  async function renderAfterStream() {
    try {
      markForceBottom(1000);
      await renderMermaidInElement(document.querySelector(".message-list"), {
        force: true,
      });
      scrollBottom({force: true, stable: true});
    } catch (error) {
      logWarn("[useChatContainerController] renderAfterStream 오류:", error);
    }
  }

  const {isGenerating, handleSubmit} = useChatSubmit({
    router,
    route,
    histories,
    messages,
    createLocalConversation,
    appendUserAndAssistantMessages,
    setConversation,
    scrollBottom: async (options) => {
      markForceBottom(2500);
      await scrollBottom(options);
    },
    renderAfterStream,
  });

  function submitIfWritable(payload) {
    if (isReadOnly.value || isActiveModelUnavailable.value) return;
    handleSubmit(payload);
  }

  const {
    startNewChat,
    startNewChatWithAssistant,
    openHistory,
    toggleTheme,
    openSwagger,
    openPlayground,
    openMobileDrawer,
    openSettings,
    openGuide,
    openNotice,
    openPrivacy,
    openTerms,
    openPersonalization,
    openLanguage,
    openAssistantFromHeader,
  } = useChatNavigationActions({
    router,
    theme,
    themeName,
    messages,
    isMobile,
    assistantSheetOpen,
    noticeOpen,
    privacyOpen,
    personalizationOpen,
    languageSheetOpen,
    mobileSettingsOpen,
    navigationStore,
    revokeMessageAttachments,
    clearCurrentChatSelection,
    selectAssistantForNewChat,
    refreshViewport,
    clearForceBottom,
    scrollBottom,
  });

  watch(isCompactScreen, updateMobileState);
  watch(platformInfo, updateMobileState);
  useEventListener(window, "resize", updateMobileState, {passive: true});
  useEventListener(window, "scroll", scheduleBottomStateCheck, {
    capture: true,
    passive: true,
  });

  watch(
    () => [route.params.id, route.params.shareId, props.mode],
    () => {
      if (runtimeReady.value) loadRouteConversation();
    }
  );

  onMounted(async () => {
    updateMobileState();
    try {
      await runtime.initialize();
    } catch (error) {
      logWarn("[useChatContainerController] runtime.initialize 오류:", error);
    }
    await loadRouteConversation();
    runtimeReady.value = true;
  });

  onBeforeUnmount(() => {
    cleanupScrollController();
    revokeMessageAttachments(messages.value);
  });

  return {
    t,
    runtimeReady,
    workspaceRef,
    assistants,
    currentAssistant,
    models,
    selectedAssistantId,
    selectedModel,
    isModelLocked,
    isActiveModelUnavailable,
    messages,
    showScrollBottom,
    assistantSheetOpen,
    noticeOpen,
    privacyOpen,
    personalizationOpen,
    languageSheetOpen,
    mobileSettingsOpen,
    historyDialogOpen,
    historyDialogMode,
    historyDialogTarget,
    historyDialogTitle,
    historyDialogMessage,
    historyNoticeOpen,
    historyNoticeMessage,
    previewImage,
    themeName,
    isMobile,
    layoutKeyboardOpen,
    isReadOnly,
    activeConversationTitle,
    workspaceAssistantLabel,
    suggestions,
    isGenerating,
    closeImagePreview,
    handlePreviewLoad,
    handlePreviewError,
    startNewChatWithAssistant,
    startNewChat,
    openHistory,
    handleHistoryMenuAction,
    closeHistoryDialog,
    confirmHistoryDialog,
    openMobileDrawer,
    toggleTheme,
    openSwagger,
    openPlayground,
    openSettings,
    openGuide,
    openNotice,
    openPrivacy,
    openTerms,
    openPersonalization,
    openLanguage,
    openAssistantFromHeader,
    submitIfWritable,
    handlePromptFocus,
    handlePromptResize,
    handleMessageContentRendered,
    scrollBottom,
  };
}
