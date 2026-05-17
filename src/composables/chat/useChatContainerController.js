import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {useAppContext} from '@/composables/useAppContext';
import {useChatRuntime} from '@/composables/useChatRuntime';
import {useChatSubmit} from '@/composables/useChatSubmit';
import {useImagePreview} from '@/composables/useImagePreview';
import {loadSharedConversation} from '@/composables/useSharedChat';
import {useViewportGuard} from '@/composables/useViewportGuard';
import {useNavigationStore} from '@/stores/navigationStore';
import {useChatMobileState} from '@/composables/chat/container/useChatMobileState';
import {useChatHistoryDialog} from '@/composables/chat/container/useChatHistoryDialog';
import {useChatOverlayController} from '@/composables/chat/container/useChatOverlayController';
import {useChatScrollController} from '@/composables/chat/container/useChatScrollController';
import {useChatInputViewport} from '@/composables/chat/container/useChatInputViewport';
import {useChatNavigationController} from '@/composables/chat/container/useChatNavigationController';
import {useChatHistoryActions} from '@/composables/chat/container/useChatHistoryActions';
import {renderMermaidInElement} from '@/utils/mermaidRenderer';
import {PROMPT_SUGGESTION_LIMIT} from '@/constants/promptSuggestions';

/**
 * @description ChatContainer의 화면 상태를 조합합니다. 세부 책임은 container sub-composable로 위임합니다.
 * @param {{mode: string}} props - ChatContainer props입니다.
 * @returns {*} ChatContainer template에서 사용하는 상태와 이벤트 핸들러입니다.
 */
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

  const scroll = useChatScrollController(props, workspaceRef);
  const overlays = useChatOverlayController();
  const {
    previewImage,
    closeImagePreview,
    handlePreviewLoad,
    handlePreviewError,
  } = useImagePreview();

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

  const {keyboardOpen, refreshViewport} = useViewportGuard({
    onChange: ({isCompact, keyboardOpen: isKeyboardOpen}) => {
      if (props.mode !== 'main' && isCompact && isKeyboardOpen) {
        scroll.scrollBottom({stable: true});
      }
    },
  });

  const layoutKeyboardOpen = computed(
    () => props.mode !== 'main' && keyboardOpen.value
  );
  const isReadOnly = computed(() => props.mode === 'shared');
  const activeHistoryId = computed(() => {
    if (props.mode === 'chat') return route.params.id;
    if (props.mode === 'shared') return route.params.shareId;
    return null;
  });
  const activeHistory = computed(() => getHistory(activeHistoryId.value));
  const activeConversationTitle = computed(() => {
    if (props.mode === 'shared') {
      return t('chat.sharedConversationTitle', {
        id: activeHistoryId.value || '',
      }).trim();
    }
    return activeHistory.value?.title || '';
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
    return currentAssistant.value?.label || 'Assistant';
  });

  const historyDialog = useChatHistoryDialog({
    t,
    activeHistoryId,
    messages,
    router,
    renameHistory,
    removeHistory,
  });

  const {handleHistoryMenuAction} = useChatHistoryActions({
    t,
    toggleHistoryBookmark,
    openRenameDialog: historyDialog.openRenameDialog,
    openDeleteDialog: historyDialog.openDeleteDialog,
    openNotice: historyDialog.openNotice,
  });

  const navigation = useChatNavigationController({
    router,
    navigationStore,
    isMobile,
    refreshViewport,
    mobileSettingsOpen: overlays.mobileSettingsOpen,
    personalizationOpen: overlays.personalizationOpen,
    noticeOpen: overlays.noticeOpen,
    languageSheetOpen: overlays.languageSheetOpen,
    assistantSheetOpen: overlays.assistantSheetOpen,
  });

  const inputViewport = useChatInputViewport({
    props,
    isReadOnly,
    isActiveModelUnavailable,
    isMobile,
    refreshViewport,
    scrollBottom: scroll.scrollBottom,
  });

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
    scroll.resetForceBottom();
  }

  async function startNewChat() {
    resetChatState();
    clearCurrentChatSelection();
    await router.push('/');
  }

  async function startNewChatWithAssistant(id) {
    resetChatState();
    await selectAssistantForNewChat(id);
    overlays.assistantSheetOpen.value = false;
    await router.push('/');
  }

  async function openHistory(item) {
    navigationStore.closeTransientPanels();
    await router.push({name: 'chat', params: {id: item.id}});
  }

  async function loadRouteConversation() {
    if (props.mode === 'main') {
      messages.value = [];
      clearCurrentChatSelection();
      return;
    }

    if (props.mode === 'shared') {
      messages.value = await loadSharedConversation(activeHistoryId.value);
      await scroll.scrollRouteToBottom();
      return;
    }

    const history = getHistory(activeHistoryId.value);
    if (!history) {
      await router.replace('/');
      return;
    }
    messages.value = await ensureConversation(history.id);
    await scroll.scrollRouteToBottom();
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
      scroll.markForceBottom(2500);
      await scroll.scrollBottom(options);
    },
    renderAfterStream: scroll.renderAfterStream,
  });

  function submitIfWritable(payload) {
    if (isReadOnly.value || isActiveModelUnavailable.value) return;
    handleSubmit(payload);
  }

  async function toggleTheme() {
    theme.toggle();
    themeName.value = theme.current;
    await nextTick();
    await renderMermaidInElement(document.querySelector('.message-list'), {
      force: true,
    });
    scroll.scrollBottom({stable: true});
  }

  const selectAssistantFromSheet = startNewChatWithAssistant;

  watch(
    () => [route.params.id, route.params.shareId, props.mode],
    () => {
      if (runtimeReady.value) loadRouteConversation();
    }
  );

  onMounted(async () => {
    startMobileStateWatch();
    window.addEventListener('scroll', scroll.scheduleBottomStateCheck, true);
    await runtime.initialize();
    await loadRouteConversation();
    runtimeReady.value = true;
  });

  onBeforeUnmount(() => {
    scroll.cleanupScrollController();
    stopMobileStateWatch();
    window.removeEventListener('scroll', scroll.scheduleBottomStateCheck, true);
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
    showScrollBottom: scroll.showScrollBottom,
    assistantSheetOpen: overlays.assistantSheetOpen,
    noticeOpen: overlays.noticeOpen,
    personalizationOpen: overlays.personalizationOpen,
    languageSheetOpen: overlays.languageSheetOpen,
    mobileSettingsOpen: overlays.mobileSettingsOpen,
    historyDialogOpen: historyDialog.historyDialogOpen,
    historyDialogMode: historyDialog.historyDialogMode,
    historyDialogTarget: historyDialog.historyDialogTarget,
    historyDialogTitle: historyDialog.historyDialogTitle,
    historyDialogMessage: historyDialog.historyDialogMessage,
    historyNoticeOpen: historyDialog.historyNoticeOpen,
    historyNoticeMessage: historyDialog.historyNoticeMessage,
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
    closeHistoryDialog: historyDialog.closeHistoryDialog,
    confirmHistoryDialog: historyDialog.confirmHistoryDialog,
    openMobileDrawer: navigation.openMobileDrawer,
    toggleTheme,
    openSwagger: navigation.openSwagger,
    openPlayground: navigation.openPlayground,
    openSettings: navigation.openSettings,
    openGuide: navigation.openGuide,
    openNotice: navigation.openNotice,
    openPersonalization: navigation.openPersonalization,
    openLanguage: navigation.openLanguage,
    openAssistantFromHeader: navigation.openAssistantFromHeader,
    selectAssistantFromSheet,
    submitIfWritable,
    handlePromptFocus: inputViewport.handlePromptFocus,
    handlePromptResize: inputViewport.handlePromptResize,
    handleMessageContentRendered: scroll.handleMessageContentRendered,
    scrollBottom: scroll.scrollBottom,
  };
}
