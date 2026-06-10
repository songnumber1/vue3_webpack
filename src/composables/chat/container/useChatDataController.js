/**
 * @file composables/chat/container/useChatDataController.js
 * @description ChatContainer 전용 controller 계층입니다. route, UI 상태, scroll, modal, submit 흐름을 도메인별 composable로 조립합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {useChatSubmit} from "@/composables/chat/useChatSubmit";
import {logWarn} from "@/utils/logger";
import {PROMPT_SUGGESTION_LIMIT} from "@/constants/promptSuggestions";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {usePlatformStore} from "@/stores/platformStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {useChatStore} from "@/stores/chatStore";
import {
  isSharedChat,
  resolveMessageRenderPolicy,
} from "@/composables/chat/message-list/useMessageRenderPolicy";
import {isMermaidRenderingEnabledForPlatform} from "@/utils/mermaidPlatformSettings";
import {useNavigationLock} from "@/composables/navigation/useNavigationLock";
import {useChatRouteController} from "@/composables/chat/route/useChatRouteController";
import {useChatRouteLoader} from "@/composables/chat/route/useChatRouteLoader";
import {useHistoryConversationLoader} from "@/composables/chat/history/useHistoryConversationLoader";
import {useSharedConversationLoader} from "@/composables/chat/shared/useSharedConversationLoader";
import {useConversationLazyHistory} from "@/composables/chat/conversation/useConversationLazyHistory";
import {useConversationRenderLifecycle} from "@/composables/chat/conversation/useConversationRenderLifecycle";

/**
 * [Route/Data controller]
 * route가 main/chat/shared 중 무엇인지에 따라 messages, active title, shared read-only 상태를 동기화합니다.
 * submit 자체의 세부 로직은 useChatSubmit.js에 있고, 이 파일은 화면 상태와 route 전환을 연결하는 역할입니다.
 */

/**
 * @function useChatDataController
 * @description Vue 3 컴포넌트 레이어와 비즈니스 런타임 코어 스토어를 연결하는 오케스트레이터 컴포저블입니다.
 * 라우팅 상태 감지, 다국어 웰컴 추천 칩 바인딩, 실시간 스크롤 동기화 및 텍스트 렌더링 완료 파이프라인을 통제합니다.
 * @param {Object} context - 컨트롤러 가동을 위해 외부 템플릿 뷰에서 주입받는 콘텍스트 소스 세트
 * @param {Object} context.props - 상위 컴포넌트가 전달한 반응형 속성 (예: mode: 'main' | 'chat' | 'shared')
 * @param {Object} context.ui - 스크롤 제어 및 모바일 환경 디텍팅을 담당하는 UI 핸들러 인프라 세트
 * @param {Object} context.runtime - 글로벌 Pinia/Vuex 스토어의 데이터 상태 및 원격 데이터 통신 액션 모음집
 * @param {Ref<Array>} context.messages - 화면 말풍선 리스트 뷰와 직접 반응형 바인딩된 실제 메시지 배열 레퍼런스
 */
export function useChatDataController({props, ui, runtime, messages}) {
  const {t, locale} = useI18n();
  const router = useRouter();
  const route = useRoute();

  // 비즈니스 인프라 마스터 데이터 부트스트랩 패치가 최종 완료되었는지를 나타내는 트리거 플래그입니다.
  const runtimeReady = ref(false);

  const apiRequestStore = useApiRequestStore();
  const platformStore = usePlatformStore();
  const systemSettingsStore = useSystemSettingsStore();
  const chatStore = useChatStore();
  const navigationLock = useNavigationLock();
  const messageRenderPolicy = computed(() =>
    resolveMessageRenderPolicy({
      isMobile: Boolean(ui.isMobile?.value),
      selectedChat: activeHistory.value,
      searchTargetMessageId: route.query?.messageId,
    })
  );

  // ── 📌 [1. 화면 라우팅 상태 분석 및 권한 가드 파트] ──────────────────
  const {
    currentMode,
    isMainPage,
    isChatPage,
    isSharedPage,
    isConversationPage,
    activeHistoryId,
    getSharedEntryId,
  } = useChatRouteController({
    props,
    route,
    chatStore,
    systemSettingsStore,
  });

  const isReadOnly = computed(
    () =>
      isSharedPage.value ||
      chatStore.isActiveSharedRoom ||
      isSharedChat(activeHistory.value)
  ); // 공유 URL 또는 sharedId가 있는 대화방은 제목 문구와 무관하게 조회 전용으로 박제합니다.

  // 비즈니스 인프라 런타임 코어 스토어로부터 화면 구성에 필요한 상태 유닛 구조 분출
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
    setMessages,
    createRemoteConversation,
    createLocalConversation,
    clearActiveSession,
    appendUserAndAssistantMessages,
    currentExamplePrompts,
    syncHistoriesInBackground,
  } = runtime;

  /**
   * 전역 히스토리 서랍 데이터 내부에서 특정 ID를 가진 채팅방 레코드를 검색합니다.
   */
  function findHistory(id) {
    if (!id) return null;
    return (
      histories.value.find((history) => String(history.id) === String(id)) ||
      null
    );
  }

  const activeHistory = computed(() => findHistory(activeHistoryId.value));

  /**
   * 대화방 이동 클릭 직후 표시용 pending id는 실제 history load 성공/실패 시점에만 정리합니다.
   * pendingSelectedChatId는 lock이 아니라 좌측 메뉴 선택 색상 선반영용 상태입니다.
   */
  function clearPendingSelectedIfMatched(chatId) {
    const pendingId = String(chatStore.pendingSelectedChatId || "").trim();
    const targetId = String(chatId || "").trim();
    if (!pendingId || pendingId === targetId) {
      chatStore.clearPendingSelectedChatId();
    }
  }

  function clearPendingSelectedOnFailure(chatId) {
    const pendingId = String(chatStore.pendingSelectedChatId || "").trim();
    const targetId = String(chatId || "").trim();
    if (!pendingId || pendingId === targetId) {
      chatStore.clearPendingSelectedChatId();
    }
  }

  function isMermaidRenderingEnabled() {
    return isMermaidRenderingEnabledForPlatform(
      systemSettingsStore.settings,
      Boolean(ui.isMobile?.value)
    );
  }

  function hasMermaidInHistoryMessages(sourceMessages = []) {
    if (!isMermaidRenderingEnabled()) return false;
    const list = Array.isArray(sourceMessages) ? sourceMessages : [];
    return list.some((message) => {
      const content = `${message?.content || ""}
${message?.reasoningContent || ""}`;
      return /```\s*mermaid/i.test(content);
    });
  }

  const renderLifecycle = useConversationRenderLifecycle({
    ui,
    chatStore,
    apiRequestStore,
    systemSettingsStore,
    platformStore,
    activeHistoryId,
    isMermaidRenderingEnabled,
    messageRenderPolicy,
    navigationLock,
  });

  const {
    isHistoryRendering,
    historyMessagesLoaded,
    beginHistoryRender,
    finishHistoryRender,
    finishHistoryRenderImmediately,
    renderAfterStream,
    cleanupHistoryRender,
  } = renderLifecycle;

  async function flushConversationSwitchPaint(options = {}) {
    return renderLifecycle.flushConversationSwitchPaint({
      messages,
      ...options,
    });
  }

  const lazyHistory = useConversationLazyHistory({
    messages,
    isChatPage,
    activeHistoryId,
    messageRenderPolicy,
    systemSettingsStore,
    isMobile: ui.isMobile,
    setMessages,
    appendUserAndAssistantMessages,
  });

  const {
    hasPreviousHistoryMessages,
    getHistoryLazyInitialCount,
    getHistoryLazyAppendCount,
    getHistoryLazyTopThresholdPx,
    clearLazyHistoryMessages,
    setHistoryMessagesForInitialRender,
    syncVisibleHistoryMessagesFromFull,
    loadPreviousHistoryMessages,
    setConversationPreservingLazyHistory,
    appendUserAndAssistantMessagesPreservingLazyHistory,
  } = lazyHistory;

  // 현재 진입한 대화방 상단 헤더 영역에 바인딩할 타이틀 텍스트를 산출합니다.
  const activeConversationTitle = computed(() => {
    if (isSharedPage.value) {
      return t("chat.sharedConversationTitle", {
        id: activeHistoryId.value || "",
      }).trim();
    }
    return activeHistory.value?.title || "";
  });

  // 워크스페이스 대화창 메인에 마운트할 어시스턴트 명칭 라벨을 동적으로 결정합니다.
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

  // ── [2. 글로벌 다국어 지원 추천 칩 가공 파트] ──────────────────
  // 현재 페르소나가 보유한 추천 예시 힌트 질문 리스트를 감지하여 다국어 설정(ko/en)에 부합하는 프로필 카드로 정형화합니다.
  const suggestions = computed(() => {
    const assistantPrompts = currentExamplePrompts.value || [];
    const isEnglish = locale.value === "en";

    return assistantPrompts
      .slice(0, PROMPT_SUGGESTION_LIMIT) // 시스템 최대 노출 리밋(개수) 가드를 적용합니다.
      .map((prompt) => {
        // 브라우저 로케일 상태에 따라 영문 정보 및 국문 정보를 유연하게 크로스 매핑 및 폴백 가드 처리합니다.
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
          text, // 추천 칩 상단 노출용 숏 텍스트 제목
          title: content || text, // 전체 마우스 호버 가이드 툴팁
          prompt: content || text, // 클릭 시 실제 하단 텍스트 인풋 창에 자동 복사 임베딩될 최종 본문 프롬프트 문장
        };
      })
      .filter((item) => item.text && item.prompt); // 비정상 공백 질문은 필터링 제거합니다.
  });

  const {loadSharedRouteConversation, redirectSharedNotFound} =
    useSharedConversationLoader({
      t,
      router,
      chatStore,
      systemSettingsStore,
      messages,
      activeHistoryId,
      getSharedEntryId,
      beginHistoryRender,
      finishHistoryRender,
      finishHistoryRenderImmediately,
      flushConversationSwitchPaint,
      clearLazyHistoryMessages,
      setHistoryMessagesForInitialRender,
      historyMessagesLoaded,
    });

  const {loadHistoryRouteConversation} = useHistoryConversationLoader({
    router,
    runtime,
    systemSettingsStore,
    chatStore,
    messages,
    isMainPage,
    activeHistoryId,
    findHistory,
    beginHistoryRender,
    finishHistoryRender,
    flushConversationSwitchPaint,
    clearLazyHistoryMessages,
    setHistoryMessagesForInitialRender,
    historyMessagesLoaded,
    clearPendingSelectedIfMatched,
    clearPendingSelectedOnFailure,
    isMermaidRenderingEnabled,
    hasMermaidInHistoryMessages,
  });

  const {loadRouteConversation, invalidateRouteLoad} = useChatRouteLoader({
    isSharedPage,
    loadSharedRouteConversation,
    loadHistoryRouteConversation,
    onLoadError: async (error, {isCurrentLoad} = {}) => {
      if (typeof isCurrentLoad === "function" && isCurrentLoad()) {
        if (isSharedPage.value) {
          await redirectSharedNotFound({
            message: error?.message || t("chat.sharedNotFoundMessage"),
          });
          return;
        }
        clearPendingSelectedOnFailure(activeHistoryId.value);
        finishHistoryRender();
      }
      logWarn("[useChatDataController] loadRouteConversation 오류:", error);
    },
  });

  // ── [5. 비동기 프롬프트 질문 전송 코어 브릿지 바인딩] ──────────────────
  const {isGenerating, submit, regenerate} = useChatSubmit({
    router,
    route,
    histories,
    messages,
    createRemoteConversation,
    createLocalConversation,
    appendUserAndAssistantMessages:
      appendUserAndAssistantMessagesPreservingLazyHistory,
    setConversation: setConversationPreservingLazyHistory,
    selectedAssistantId,
    selectedModel,
    models,
    // 최하단 화면 마크업 렌더링 스크롤 최적화 로직 인터셉트 주입
    scrollBottom: async (options = {}) => {
      if (options.autoAnswer && !ui.autoScrollOnAnswer.value) return;
      if (options.autoAnswer) ui.markForceBottom(2500);
      await ui.scrollBottom(options);
    },
    scrollLatestUserMessage: ui.scrollLatestUserMessage,
    autoScrollOnAnswer: ui.autoScrollOnAnswer,
    syncHistories: () => syncHistoriesInBackground({notifyOnError: true}), // 전송 성공 직후 사이드바 히스토리 타이틀 스냅샷 백그라운드 동기화
    renderAfterStream,
    canWrite: () =>
      !isReadOnly.value &&
      !isHistoryRendering.value &&
      !chatStore.isNavigationLocked &&
      !isActiveModelUnavailable.value, // 현재 전송 가능 상태 가드 밸리데이션 검증식
    isReadOnly,
    isActiveModelUnavailable,
    markNewSubmitConversation:
      chatStore.markPendingNewSubmitChat.bind(chatStore),
  });

  // ── 👀 [6. 반응형 런타임 데이터 이벤트 왓처 버스 맵핑] ──────────────────
  /**
   * @function bindDataEvents
   * @description 라우트 주소 변경 및 스토어 백그라운드 메시지 갱신 내역을 감시하는 반응형 리스너 버스를 개통합니다.
   */
  function bindDataEvents() {
    // 왓처 A: 사용자가 URL 주소를 바꾸거나 뒤로가기/앞으로가기 및 메인 전환 모션을 취할 시 감지하여 세션 복원 함수를 호출합니다.
    watch(
      () => [
        route.params.id,
        route.params.shareId,
        chatStore.activeRoomId,
        chatStore.activeRoomType,
        systemSettingsStore.settings.conversationUrlMode,
        route.query?.messageId,
        currentMode.value,
      ],
      () => {
        if (runtimeReady.value) loadRouteConversation();
      }
    );

    // 왓처 B: 다른 브라우저 탭이나 소켓 채널을 통해 동일한 대화방의 백그라운드 메시지 상태 배열 레퍼런스가 교체되는 현상을 추적 복원합니다.
    watch(
      () => {
        if (!isChatPage.value || !activeHistoryId.value) return null;
        return runtime.conversations.value?.[activeHistoryId.value] || null;
      },
      (nextMessages) => {
        if (!Array.isArray(nextMessages)) return;
        if (isHistoryRendering.value) return;
        if (messages.value === nextMessages) return; // 메모리 참조 포인터가 완벽하게 일치한다면 중복 할당 연산을 무시 차단합니다.

        if (syncVisibleHistoryMessagesFromFull(nextMessages)) {
          return;
        }

        messages.value = nextMessages;
      },
      {deep: true}
    );
  }

  // ── 🎬 [7. 컴포넌트 생명주기 초동 엔진 시동 파트] ──────────────────
  /**
   * @function initializeDataController
   * @description Vue 컴포넌트 마운트 라이프사이클에 체인하여 하위 디바이스 뷰포트 정합성을 맞추고, 비즈니스 런타임을 정식 구동합니다.
   */
  function initializeDataController() {
    onMounted(async () => {
      ui.updateMobileState(); // 1단계: 모바일 가로/세로 해상도 레이아웃 상태 초기 갱신 조율
      try {
        await runtime.initialize(); // 2단계: 최상위 비즈니스 스토어 부트스트랩 패치 기동
      } catch (error) {
        logWarn("[useChatDataController] runtime.initialize 오류:", error);
      }
      await loadRouteConversation(); // 3단계: 현재 주소창에 박제되어 있는 대화 내역 원격 자동 동기화 복원
      runtimeReady.value = true; // 4단계: 전체 프로세스 정상 가동 청신호 개통 선언
    });

    onBeforeUnmount(() => {
      invalidateRouteLoad();
      cleanupHistoryRender();
    });
  }

  // Vue 3 SFC <script setup> 템플릿 마크업 영역으로 최종 환원 가치 바인딩 리스트 노출
  return {
    runtimeReady,
    messages,
    assistants,
    currentAssistant,
    models,
    selectedAssistantId,
    selectedModel,
    isModelLocked,
    isActiveModelUnavailable,
    activeHistoryId,
    isMainPage,
    isChatPage,
    isSharedPage,
    isConversationPage,
    isReadOnly,
    activeConversationTitle,
    workspaceAssistantLabel,
    suggestions,
    isGenerating,
    isHistoryRendering,
    historyMessagesLoaded,
    hasPreviousHistoryMessages,
    messageRenderPolicy,
    historyLazyTopThreshold: computed(() => getHistoryLazyTopThresholdPx()),
    historyLazyChunkSize: computed(() => getHistoryLazyAppendCount()),
    pcHistoryLazyInitialCount: computed(
      () => systemSettingsStore.pcHistoryLazyInitialCount
    ),
    pcHistoryLazyAppendCount: computed(
      () => systemSettingsStore.pcHistoryLazyAppendCount
    ),
    pcHistoryLazyTopThresholdPx: computed(
      () => systemSettingsStore.pcHistoryLazyTopThresholdPx
    ),
    mobileHistoryLazyInitialCount: computed(
      () => systemSettingsStore.mobileHistoryLazyInitialCount
    ),
    mobileHistoryLazyAppendCount: computed(
      () => systemSettingsStore.mobileHistoryLazyAppendCount
    ),
    loadPreviousHistoryMessages,
    finishHistoryRender,
    submit,
    regenerate,
    bindDataEvents,
    initializeDataController,
  };
}
