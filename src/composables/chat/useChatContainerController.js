import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useRoute, useRouter} from 'vue-router';
import {useAppContext} from '@/composables/useAppContext';
import {useAutoScroll} from '@/composables/useAutoScroll';
import {useChatRuntime} from '@/composables/useChatRuntime';
import {useChatSubmit} from '@/composables/useChatSubmit';
import {useImagePreview} from '@/composables/useImagePreview';
import {loadSharedConversation} from '@/composables/useSharedChat';
import {useViewportGuard} from '@/composables/useViewportGuard';
import {useNavigationStore} from '@/stores/navigationStore';
import {addMediaQueryListener} from '@/utils/dom';
import {renderMermaidInElement} from '@/utils/mermaidRenderer';
import {PROMPT_SUGGESTION_LIMIT} from '@/constants/promptSuggestions';
import {MOBILE_BREAKPOINT_PX} from '@/constants/uiTokens';

/**
 * Creates the page controller for ChatContainer.vue.
 * @param {{mode: string}} props Component props.
 * @returns {object} Reactive state and event handlers consumed by the template.
 */
export function useChatContainerController(props) {
  const {t, locale} = useI18n();
  const router = useRouter();
  const route = useRoute();
  const {theme} = useAppContext();
  const runtime = useChatRuntime();
  const navigationStore = useNavigationStore();
  const {scrollToBottom} = useAutoScroll({value: null});
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
  } = runtime;

  const workspaceRef = ref(null);
  const themeName = ref(theme.current);
  const isMobile = ref(false);
  const messages = ref([]);
  const showScrollBottom = ref(false);
  const assistantSheetOpen = ref(false);
  const noticeOpen = ref(false);
  const personalizationOpen = ref(false);
  const languageSheetOpen = ref(false);
  const mobileSettingsOpen = ref(false);
  const runtimeReady = ref(false);
  const {previewImage, closeImagePreview, handlePreviewLoad, handlePreviewError} =
    useImagePreview();

  let removeMobileMediaQueryListener = null;
  let bottomStateTimer = 0;
  let forceBottomUntil = 0;

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
      return `공유 대화 ${activeHistoryId.value || ''}`.trim();
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

  function getMessageListRef() {
    const exposed = workspaceRef.value?.listRef;
    if (exposed?.scrollToBottom) return exposed;
    if (exposed?.value?.scrollToBottom) return exposed.value;
    return null;
  }

  function updateMobileState() {
    isMobile.value = Boolean(
      window.matchMedia?.(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`)?.matches ||
        window.innerWidth <= MOBILE_BREAKPOINT_PX ||
        document.querySelector('.app-container--mobile')
    );
  }

  function markForceBottom(duration = 1800) {
    forceBottomUntil = Date.now() + duration;
  }

  function shouldKeepForceBottom() {
    return Date.now() <= forceBottomUntil;
  }

  async function scrollBottom(options = {}) {
    const list = getMessageListRef();
    if (list?.scrollToBottom) {
      list.scrollToBottom(options);
    } else {
      await scrollToBottom(options);
    }
    updateScrollBottomButton();
  }

  function updateScrollBottomButton() {
    const list = getMessageListRef();
    showScrollBottom.value =
      (props.mode === 'chat' || props.mode === 'shared') &&
      Boolean(list && !list.isAtBottom?.());
  }

  function scheduleBottomStateCheck() {
    window.clearTimeout(bottomStateTimer);
    bottomStateTimer = window.setTimeout(updateScrollBottomButton, 80);
  }

  function handleMessageContentRendered() {
    if (shouldKeepForceBottom()) scrollBottom({force: true, stable: true});
    scheduleBottomStateCheck();
  }

  function handlePromptFocus() {
    if (isReadOnly.value || isActiveModelUnavailable.value) return;
    refreshViewport();
    if (props.mode === 'main') return;
    scrollBottom({stable: true, force: isMobile.value});
  }

  function handlePromptResize() {
    if (isReadOnly.value || isActiveModelUnavailable.value) return;
    if (props.mode === 'main') return;
    scrollBottom({stable: true, force: isMobile.value});
  }

  async function startNewChat() {
    revokeMessageAttachments(messages.value);
    messages.value = [];
    clearCurrentChatSelection();
    navigationStore.closeTransientPanels();
    forceBottomUntil = 0;
    await router.push('/');
  }

  async function startNewChatWithAssistant(id) {
    revokeMessageAttachments(messages.value);
    messages.value = [];
    await selectAssistantForNewChat(id);
    navigationStore.closeTransientPanels();
    assistantSheetOpen.value = false;
    forceBottomUntil = 0;
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
      markForceBottom();
      await nextTick();
      await scrollBottom({behavior: 'auto', force: true, stable: true});
      return;
    }

    const history = getHistory(activeHistoryId.value);
    if (!history) {
      await router.replace('/');
      return;
    }
    messages.value = await ensureConversation(history.id);
    markForceBottom();
    await nextTick();
    await scrollBottom({behavior: 'auto', force: true, stable: true});
  }

  async function renderAfterStream() {
    markForceBottom(1000);
    await renderMermaidInElement(document.querySelector('.message-list'), {
      force: true,
    });
    scrollBottom({force: true, stable: true});
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

  async function toggleTheme() {
    theme.toggle();
    themeName.value = theme.current;
    await nextTick();
    await renderMermaidInElement(document.querySelector('.message-list'), {
      force: true,
    });
    scrollBottom({stable: true});
  }

  function openSwagger() {
    router.push('/swagger');
  }

  function openPlayground() {
    navigationStore.setDrawerOpen(false);
    router.push({name: 'playground'});
  }

  function openMobileDrawer() {
    const activeElement =
      typeof document !== 'undefined' ? document.activeElement : null;
    if (activeElement?.blur) activeElement.blur();
    navigationStore.setDrawerOpen(true);
    window.setTimeout(refreshViewport, 50);
    window.setTimeout(refreshViewport, 180);
  }

  function openSettings() {
    if (isMobile.value) {
      navigationStore.setDrawerOpen(false);
      mobileSettingsOpen.value = true;
      return;
    }
    openPersonalization();
  }

  function openGuide() {
    navigationStore.setDrawerOpen(false);
    router.push({name: 'guide'});
  }

  function openNotice() {
    navigationStore.setDrawerOpen(false);
    noticeOpen.value = true;
  }

  function openPersonalization() {
    navigationStore.setDrawerOpen(false);
    personalizationOpen.value = true;
  }

  function openLanguage() {
    languageSheetOpen.value = true;
  }

  function openAssistantFromHeader() {
    assistantSheetOpen.value = true;
  }

  function selectAssistantFromSheet(id) {
    startNewChatWithAssistant(id);
  }

  watch(
    () => [route.params.id, route.params.shareId, props.mode],
    () => {
      if (runtimeReady.value) loadRouteConversation();
    }
  );

  onMounted(async () => {
    updateMobileState();
    removeMobileMediaQueryListener = addMediaQueryListener(
      `(max-width: ${MOBILE_BREAKPOINT_PX}px)`,
      updateMobileState
    );
    window.addEventListener('resize', updateMobileState, {passive: true});
    window.addEventListener('scroll', scheduleBottomStateCheck, true);
    await runtime.initialize();
    await loadRouteConversation();
    runtimeReady.value = true;
  });

  onBeforeUnmount(() => {
    window.clearTimeout(bottomStateTimer);
    removeMobileMediaQueryListener?.();
    window.removeEventListener('resize', updateMobileState);
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
    openMobileDrawer,
    toggleTheme,
    openSwagger,
    openPlayground,
    openSettings,
    openGuide,
    openNotice,
    openPersonalization,
    openLanguage,
    openAssistantFromHeader,
    selectAssistantFromSheet,
    submitIfWritable,
    handlePromptFocus,
    handlePromptResize,
    handleMessageContentRendered,
    scrollBottom,
  };
}
