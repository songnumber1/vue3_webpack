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

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description useChatContainerController 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} props - props 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
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
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
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
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (props.mode === 'chat') return route.params.id;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (props.mode === 'shared') return route.params.shareId;
    // 계산된 결과를 호출부로 반환합니다.
    return null;
  });
  const activeHistory = computed(() => getHistory(activeHistoryId.value));
  const activeConversationTitle = computed(() => {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (props.mode === 'shared') {
      // 계산된 결과를 호출부로 반환합니다.
      return `공유 대화 ${activeHistoryId.value || ''}`.trim();
    }
    // 계산된 결과를 호출부로 반환합니다.
    return activeHistory.value?.title || '';
  });
  const workspaceAssistantLabel = computed(() => {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (activeSession.value?.displayAssistantLabel) {
      // 계산된 결과를 호출부로 반환합니다.
      return activeSession.value.displayAssistantLabel;
    }
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (
      activeSession.value?.assistantLabel &&
      !activeSession.value?.isModelUnavailable
    ) {
      // 계산된 결과를 호출부로 반환합니다.
      return activeSession.value.assistantLabel;
    }
    // 계산된 결과를 호출부로 반환합니다.
    return currentAssistant.value?.label || 'Assistant';
  });
  const suggestions = computed(() => {
    const assistantPrompts = currentExamplePrompts.value || [];
    const isEnglish = locale.value === 'en';

    // 계산된 결과를 호출부로 반환합니다.
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

        // 계산된 결과를 호출부로 반환합니다.
        return {
          id: prompt.id,
          text,
          title: content || text,
          prompt: content || text,
        };
      })
      .filter((item) => item.text && item.prompt);
  });

  /**
   * @description getMessageListRef 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function getMessageListRef() {
    const exposed = workspaceRef.value?.listRef;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (exposed?.scrollToBottom) return exposed;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (exposed?.value?.scrollToBottom) return exposed.value;
    // 계산된 결과를 호출부로 반환합니다.
    return null;
  }

  /**
   * @description updateMobileState 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function updateMobileState() {
    isMobile.value = Boolean(
      window.matchMedia?.(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`)?.matches ||
        window.innerWidth <= MOBILE_BREAKPOINT_PX ||
        document.querySelector('.app-container--mobile')
    );
  }

  /**
   * @description markForceBottom 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} duration - duration 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function markForceBottom(duration = 1800) {
    forceBottomUntil = Date.now() + duration;
  }

  /**
   * @description shouldKeepForceBottom 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function shouldKeepForceBottom() {
    // 계산된 결과를 호출부로 반환합니다.
    return Date.now() <= forceBottomUntil;
  }

  /**
   * @description scrollBottom 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} options - options 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  async function scrollBottom(options = {}) {
    const list = getMessageListRef();
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (list?.scrollToBottom) {
      list.scrollToBottom(options);
    } else {
      await scrollToBottom(options);
    }
    updateScrollBottomButton();
  }

  /**
   * @description updateScrollBottomButton 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function updateScrollBottomButton() {
    const list = getMessageListRef();
    showScrollBottom.value =
      (props.mode === 'chat' || props.mode === 'shared') &&
      Boolean(list && !list.isAtBottom?.());
  }

  /**
   * @description scheduleBottomStateCheck 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function scheduleBottomStateCheck() {
    window.clearTimeout(bottomStateTimer);
    bottomStateTimer = window.setTimeout(updateScrollBottomButton, 80);
  }

  /**
   * @description handleMessageContentRendered 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function handleMessageContentRendered() {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (shouldKeepForceBottom()) scrollBottom({force: true, stable: true});
    scheduleBottomStateCheck();
  }

  /**
   * @description handlePromptFocus 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function handlePromptFocus() {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (isReadOnly.value || isActiveModelUnavailable.value) return;
    refreshViewport();
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (props.mode === 'main') return;
    scrollBottom({stable: true, force: isMobile.value});
  }

  /**
   * @description handlePromptResize 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function handlePromptResize() {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (isReadOnly.value || isActiveModelUnavailable.value) return;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (props.mode === 'main') return;
    scrollBottom({stable: true, force: isMobile.value});
  }

  /**
   * @description startNewChat 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  async function startNewChat() {
    revokeMessageAttachments(messages.value);
    messages.value = [];
    clearCurrentChatSelection();
    navigationStore.closeTransientPanels();
    forceBottomUntil = 0;
    await router.push('/');
  }

  /**
   * @description startNewChatWithAssistant 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} id - id 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  async function startNewChatWithAssistant(id) {
    revokeMessageAttachments(messages.value);
    messages.value = [];
    await selectAssistantForNewChat(id);
    navigationStore.closeTransientPanels();
    assistantSheetOpen.value = false;
    forceBottomUntil = 0;
    await router.push('/');
  }

  /**
   * @description openHistory 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} item - item 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  async function openHistory(item) {
    navigationStore.closeTransientPanels();
    await router.push({name: 'chat', params: {id: item.id}});
  }

  /**
   * @description loadRouteConversation 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  async function loadRouteConversation() {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (props.mode === 'main') {
      messages.value = [];
      clearCurrentChatSelection();
      return;
    }

    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (props.mode === 'shared') {
      messages.value = await loadSharedConversation(activeHistoryId.value);
      markForceBottom();
      await nextTick();
      await scrollBottom({behavior: 'auto', force: true, stable: true});
      return;
    }

    const history = getHistory(activeHistoryId.value);
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!history) {
      await router.replace('/');
      return;
    }
    messages.value = await ensureConversation(history.id);
    markForceBottom();
    await nextTick();
    await scrollBottom({behavior: 'auto', force: true, stable: true});
  }

  /**
   * @description renderAfterStream 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
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

  /**
   * @description submitIfWritable 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} payload - payload 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function submitIfWritable(payload) {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (isReadOnly.value || isActiveModelUnavailable.value) return;
    handleSubmit(payload);
  }

  /**
   * @description toggleTheme 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  async function toggleTheme() {
    theme.toggle();
    themeName.value = theme.current;
    await nextTick();
    await renderMermaidInElement(document.querySelector('.message-list'), {
      force: true,
    });
    scrollBottom({stable: true});
  }

  /**
   * @description openSwagger 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function openSwagger() {
    router.push('/swagger');
  }

  /**
   * @description openPlayground 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function openPlayground() {
    navigationStore.setDrawerOpen(false);
    router.push({name: 'playground'});
  }

  /**
   * @description openMobileDrawer 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function openMobileDrawer() {
    const activeElement =
      typeof document !== 'undefined' ? document.activeElement : null;
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (activeElement?.blur) activeElement.blur();
    navigationStore.setDrawerOpen(true);
    window.setTimeout(refreshViewport, 50);
    window.setTimeout(refreshViewport, 180);
  }

  /**
   * @description openSettings 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function openSettings() {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (isMobile.value) {
      navigationStore.setDrawerOpen(false);
      mobileSettingsOpen.value = true;
      return;
    }
    openPersonalization();
  }

  /**
   * @description openGuide 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function openGuide() {
    navigationStore.setDrawerOpen(false);
    router.push({name: 'guide'});
  }

  /**
   * @description openNotice 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function openNotice() {
    navigationStore.setDrawerOpen(false);
    noticeOpen.value = true;
  }

  /**
   * @description openPersonalization 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function openPersonalization() {
    navigationStore.setDrawerOpen(false);
    personalizationOpen.value = true;
  }

  /**
   * @description openLanguage 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function openLanguage() {
    languageSheetOpen.value = true;
  }

  /**
   * @description openAssistantFromHeader 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function openAssistantFromHeader() {
    assistantSheetOpen.value = true;
  }

  /**
   * @description selectAssistantFromSheet 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
   * @param {*} id - id 입력값입니다.
   * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
   */
  function selectAssistantFromSheet(id) {
    startNewChatWithAssistant(id);
  }

  // Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
  watch(
    () => [route.params.id, route.params.shareId, props.mode],
    () => {
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (runtimeReady.value) loadRouteConversation();
    }
  );

  // Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
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

  // Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
  onBeforeUnmount(() => {
    window.clearTimeout(bottomStateTimer);
    removeMobileMediaQueryListener?.();
    window.removeEventListener('resize', updateMobileState);
    window.removeEventListener('scroll', scheduleBottomStateCheck, true);
    revokeMessageAttachments(messages.value);
  });

  // 계산된 결과를 호출부로 반환합니다.
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
