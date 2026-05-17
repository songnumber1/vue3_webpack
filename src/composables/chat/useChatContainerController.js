import {computed, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {useAppContext} from '@/composables/useAppContext';
import {useChatRuntime} from '@/composables/useChatRuntime';
import {useChatSubmit} from '@/composables/useChatSubmit';
import {useImagePreview} from '@/composables/useImagePreview';
import {useViewportGuard} from '@/composables/useViewportGuard';
import {useNavigationStore} from '@/stores/navigationStore';
import {useChatMobileState} from '@/composables/chat/container/useChatMobileState';
import {useChatHistoryDialog} from '@/composables/chat/container/useChatHistoryDialog';
import {useChatOverlayController} from '@/composables/chat/container/useChatOverlayController';
import {useChatScrollController} from '@/composables/chat/container/useChatScrollController';
import {useChatNavigationActions} from '@/composables/chat/container/useChatNavigationActions';
import {useChatRouteConversation} from '@/composables/chat/container/useChatRouteConversation';
import {renderMermaidInElement} from '@/utils/mermaidRenderer';
import {PROMPT_SUGGESTION_LIMIT} from '@/constants/promptSuggestions';

export function useChatContainerController(props) {
  const {t, locale} = useI18n();
  const router = useRouter();
  const route = useRoute();
  const {theme} = useAppContext();
  const runtime = useChatRuntime();
  const navigationStore = useNavigationStore();
  const workspaceRef = ref(null);
  const themeName = ref(theme.current);
  const messages = ref([]);
  const runtimeReady = ref(false);

  const {isMobile, startMobileStateWatch, stopMobileStateWatch} =
    useChatMobileState();
  const overlay = useChatOverlayController();
  const {
    assistantSheetOpen,
    noticeOpen,
    personalizationOpen,
    languageSheetOpen,
    mobileSettingsOpen,
    historyDialogOpen,
    historyNoticeOpen,
    overlayKeys,
    openOverlay,
    closeOverlay,
  } = overlay;

  const scrollController = useChatScrollController({props, workspaceRef});
  const {
    showScrollBottom,
    markForceBottom,
    resetForceBottom,
    scrollBottom,
    scrollToRouteBottom,
    scheduleBottomStateCheck,
    handleMessageContentRendered,
    cleanupScrollController,
  } = scrollController;

  const {keyboardOpen, refreshViewport} = useViewportGuard({
    onChange: ({isCompact, keyboardOpen: isKeyboardOpen}) => {
      if (props.mode !== 'main' && isCompact && isKeyboardOpen) {
        scrollBottom({stable: true});
      }
    },
  });

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

  const layoutKeyboardOpen = computed(
    () => props.mode !== 'main' && keyboardOpen.value
  );
  const isReadOnly = computed(() => props.mode === 'shared');

  const routeConversation = useChatRouteConversation({
    props,
    t,
    route,
    router,
    messages,
    activeSession,
    currentAssistant,
    getHistory,
    ensureConversation,
    clearCurrentChatSelection,
    scrollToRouteBottom,
  });
  const {
    activeHistoryId,
    activeConversationTitle,
    workspaceAssistantLabel,
    loadRouteConversation,
  } = routeConversation;

  const historyDialog = useChatHistoryDialog({
    t,
    activeHistoryId,
    messages,
    router,
    renameHistory,
    removeHistory,
    openOverlay,
    closeOverlay,
    overlayKeys,
  });
  const {
    historyDialogMode,
    historyDialogTarget,
    historyNoticeMessage,
    historyDialogTitle,
    historyDialogMessage,
    openRenameDialog,
    openDeleteDialog,
    openNotice: openHistoryNotice,
    closeHistoryDialog,
    confirmHistoryDialog,
  } = historyDialog;

  const suggestions = computed(() => {
    const assistantPrompts = currentExamplePrompts.value || [];
    const isEnglish = locale.value === 'en';

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

  function resetChatState() {
    revokeMessageAttachments(messages.value);
    messages.value = [];
    navigationStore.closeTransientPanels();
    resetForceBottom();
  }

  async function renderAfterStream() {
    markForceBottom(1000);
    await renderMermaidInElement(document.querySelector('.message-list'), {
      force: true,
    });
    scrollBottom({force: true, stable: true});
  }

  const {isGenerating, handleSubmit} = useChatSubmit({
    t,
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

  function syncPromptViewport({refresh = false} = {}) {
    if (isReadOnly.value || isActiveModelUnavailable.value) return;
    if (refresh) refreshViewport();
    if (props.mode === 'main') return;
    scrollBottom({stable: true, force: isMobile.value});
  }

  function handlePromptFocus() {
    syncPromptViewport({refresh: true});
  }

  function handlePromptResize() {
    syncPromptViewport();
  }

  async function toggleThemeAndRender() {
    await navigationActions.toggleTheme();
    scrollBottom({stable: true});
  }

  async function handleHistoryMenuAction(payload = {}) {
    const {action, history} = payload;
    if (!history || !action) return;

    if (action === 'pin' || action === 'unpin') {
      await toggleHistoryBookmark(history);
      return;
    }

    if (action === 'rename') {
      openRenameDialog(history);
      return;
    }

    if (action === 'share') {
      openHistoryNotice(t('chat.historyMenu.shareNotice'));
      return;
    }

    if (action === 'delete') {
      openDeleteDialog(history);
    }
  }

  const navigationActions = useChatNavigationActions({
    router,
    navigationStore,
    theme,
    themeName,
    isMobile,
    refreshViewport,
    overlayKeys,
    openOverlay,
    closeOverlay,
    resetChatState,
    clearCurrentChatSelection,
    selectAssistantForNewChat,
  });

  watch(
    () => [route.params.id, route.params.shareId, props.mode],
    () => {
      if (runtimeReady.value) loadRouteConversation();
    }
  );

  onMounted(async () => {
    startMobileStateWatch();
    window.addEventListener('scroll', scheduleBottomStateCheck, true);
    await runtime.initialize();
    await loadRouteConversation();
    runtimeReady.value = true;
  });

  onBeforeUnmount(() => {
    cleanupScrollController();
    stopMobileStateWatch();
    window.removeEventListener('scroll', scheduleBottomStateCheck, true);
    revokeMessageAttachments(messages.value);
  });

  return {
    t,
    runtimeReady,
    workspaceRef,
    assistants,
    models,
    selectedAssistantId,
    selectedModel,
    isModelLocked,
    isActiveModelUnavailable,
    messages,
    showScrollBottom,
    assistantSheetOpen,
    noticeOpen,
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
    startNewChatWithAssistant: navigationActions.startNewChatWithAssistant,
    startNewChat: navigationActions.startNewChat,
    openHistory: navigationActions.openHistory,
    handleHistoryMenuAction,
    closeHistoryDialog,
    confirmHistoryDialog,
    openMobileDrawer: navigationActions.openMobileDrawer,
    toggleTheme: toggleThemeAndRender,
    openSwagger: navigationActions.openSwagger,
    openPlayground: navigationActions.openPlayground,
    openSettings: navigationActions.openSettings,
    openGuide: navigationActions.openGuide,
    openNotice: navigationActions.openNotice,
    openPersonalization: navigationActions.openPersonalization,
    openLanguage: navigationActions.openLanguage,
    openAssistantFromHeader: navigationActions.openAssistantFromHeader,
    selectAssistantFromSheet: navigationActions.selectAssistantFromSheet,
    submitIfWritable,
    handlePromptFocus,
    handlePromptResize,
    handleMessageContentRendered,
    scrollBottom,
  };
}
