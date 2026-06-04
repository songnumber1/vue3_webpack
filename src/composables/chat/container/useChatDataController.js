/**
 * @file composables/chat/container/useChatDataController.js
 * @description ChatContainer 전용 controller 계층입니다. route, UI 상태, scroll, modal, submit 흐름을 도메인별 composable로 조립합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {storeToRefs} from "pinia";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {useChatSubmit} from "@/composables/chat/useChatSubmit";
import {loadSharedConversation} from "@/composables/chat/useSharedChat";
import {
  renderMermaidInElement,
  warmupMermaidForHistoryRender,
} from "@/utils/mermaidRenderer";
import {logWarn} from "@/utils/logger";
import {PROMPT_SUGGESTION_LIMIT} from "@/constants/promptSuggestions";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {useChatStore} from "@/stores/chatStore";

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
  const isHistoryRendering = ref(false);
  const historyMessagesLoaded = ref(false);
  const DEFAULT_HISTORY_LAZY_CHUNK_SIZE = 100;

  function getHistoryLazyChunkSize() {
    const value = Number(systemSettingsStore.historyLazyChunkSize);
    return Number.isFinite(value) && value > 0
      ? Math.max(1, Math.round(value))
      : DEFAULT_HISTORY_LAZY_CHUNK_SIZE;
  }
  const fullHistoryMessages = ref([]);
  const historyVisibleStartIndex = ref(0);
  const hasPreviousHistoryMessages = computed(
    () => isChatPage.value && historyVisibleStartIndex.value > 0
  );
  const apiRequestStore = useApiRequestStore();
  const systemSettingsStore = useSystemSettingsStore();
  const chatStore = useChatStore();
  let historyRenderOverlayActive = false;
  let routeConversationLoadSeq = 0;
  let historyRenderFinishSeq = 0;

  function waitForNextPaint() {
    if (typeof window === "undefined") return Promise.resolve();
    return new Promise((resolve) => {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(resolve);
      });
    });
  }

  async function flushConversationSwitchPaint({clearMessages = true} = {}) {
    if (clearMessages) {
      messages.value = [];
    }

    await nextTick();
    await waitForNextPaint();
  }

  function clearLazyHistoryMessages() {
    fullHistoryMessages.value = [];
    historyVisibleStartIndex.value = 0;
  }

  function getInitialLazyHistorySlice(sourceMessages = []) {
    const list = Array.isArray(sourceMessages) ? sourceMessages : [];
    const start = Math.max(list.length - getHistoryLazyChunkSize(), 0);
    return {start, visibleMessages: list.slice(start)};
  }

  function setHistoryMessagesForInitialRender(sourceMessages = []) {
    const list = Array.isArray(sourceMessages) ? sourceMessages : [];
    fullHistoryMessages.value = list;
    const {start, visibleMessages} = getInitialLazyHistorySlice(list);
    historyVisibleStartIndex.value = start;
    messages.value = visibleMessages;
  }

  function syncVisibleHistoryMessagesFromFull(sourceMessages = []) {
    const list = Array.isArray(sourceMessages) ? sourceMessages : [];
    if (!isChatPage.value || !fullHistoryMessages.value.length) {
      fullHistoryMessages.value = list;
      return false;
    }

    const currentVisibleCount = Math.max(
      messages.value.length,
      Math.min(getHistoryLazyChunkSize(), list.length)
    );
    const isShowingLatest =
      historyVisibleStartIndex.value + messages.value.length >=
      fullHistoryMessages.value.length;

    fullHistoryMessages.value = list;

    if (isShowingLatest) {
      const count = Math.max(currentVisibleCount, getHistoryLazyChunkSize());
      historyVisibleStartIndex.value = Math.max(list.length - count, 0);
    } else {
      historyVisibleStartIndex.value = Math.min(
        historyVisibleStartIndex.value,
        Math.max(list.length - 1, 0)
      );
    }

    const end = isShowingLatest
      ? list.length
      : Math.min(
          historyVisibleStartIndex.value + currentVisibleCount,
          list.length
        );
    messages.value = list.slice(historyVisibleStartIndex.value, end);
    return true;
  }

  function hasMermaidInHistoryMessages(sourceMessages = []) {
    const list = Array.isArray(sourceMessages) ? sourceMessages : [];
    return list.some((message) => {
      const content = `${message?.content || ""}
${message?.reasoningContent || ""}`;
      return /```\s*mermaid/i.test(content);
    });
  }

  function loadPreviousHistoryMessages() {
    if (!isChatPage.value) return false;
    const list = fullHistoryMessages.value;
    if (!Array.isArray(list) || !list.length) return false;
    if (historyVisibleStartIndex.value <= 0) return false;

    const previousStart = historyVisibleStartIndex.value;
    const nextStart = Math.max(previousStart - getHistoryLazyChunkSize(), 0);
    if (nextStart === previousStart) return false;

    historyVisibleStartIndex.value = nextStart;
    messages.value = list.slice(nextStart);
    return true;
  }

  function isLazyHistoryActiveForChat(chatId) {
    return (
      isChatPage.value &&
      String(activeHistoryId.value || "") === String(chatId || "") &&
      Array.isArray(fullHistoryMessages.value) &&
      fullHistoryMessages.value.length > 0
    );
  }

  function mergeVisibleMessagesIntoFullHistory(nextVisibleMessages = []) {
    const existing = Array.isArray(fullHistoryMessages.value)
      ? fullHistoryMessages.value
      : [];
    const start = Math.max(0, historyVisibleStartIndex.value);
    const visible = Array.isArray(nextVisibleMessages)
      ? nextVisibleMessages
      : [];

    const merged = [...existing.slice(0, start), ...visible];
    fullHistoryMessages.value = merged;
    messages.value = visible;
    return merged;
  }

  function setConversationPreservingLazyHistory(chatId, nextMessages) {
    if (isLazyHistoryActiveForChat(chatId)) {
      const merged = mergeVisibleMessagesIntoFullHistory(nextMessages);
      setMessages(chatId, merged);
      return;
    }

    setMessages(chatId, nextMessages);
  }

  function appendUserAndAssistantMessagesPreservingLazyHistory(
    chatId,
    normalized
  ) {
    const result = appendUserAndAssistantMessages(chatId, normalized);

    if (!isLazyHistoryActiveForChat(chatId)) {
      return result;
    }

    fullHistoryMessages.value = Array.isArray(result.messages)
      ? result.messages
      : [];

    const visibleCount = Math.max(
      getHistoryLazyChunkSize(),
      Math.min(
        fullHistoryMessages.value.length,
        (messages.value?.length || 0) + 2
      )
    );
    historyVisibleStartIndex.value = Math.max(
      fullHistoryMessages.value.length - visibleCount,
      0
    );
    const visibleMessages = fullHistoryMessages.value.slice(
      historyVisibleStartIndex.value
    );
    messages.value = visibleMessages;

    return {
      messages: visibleMessages,
      assistantMessage: result.assistantMessage,
    };
  }

  function clearPendingSelectedIfMatched(chatId) {
    const pendingId = String(chatStore.pendingSelectedChatId || "");
    const targetId = String(chatId || "");
    if (!pendingId || pendingId === targetId) {
      chatStore.clearPendingSelectedChatId();
    }
  }

  function clearPendingSelectedOnFailure(chatId) {
    const pendingId = String(chatStore.pendingSelectedChatId || "");
    if (!pendingId || pendingId === String(chatId || "")) {
      chatStore.clearPendingSelectedChatId();
    }
  }

  function beginHistoryRender() {
    historyRenderFinishSeq += 1;
    historyMessagesLoaded.value = false;
    isHistoryRendering.value = true;
    if (
      systemSettingsStore.showMobileApiProgress &&
      !historyRenderOverlayActive
    ) {
      apiRequestStore.startOverlay();
      historyRenderOverlayActive = true;
    }
  }

  function finishHistoryRender() {
    const finishSeq = ++historyRenderFinishSeq;

    const revealAfterPaint = async () => {
      try {
        await nextTick();
        await waitForNextPaint();
        if (finishSeq !== historyRenderFinishSeq) return;

        // MessageList가 hidden 상태에서 Markdown/Mermaid/하단 스크롤을 모두 끝낸 뒤에만
        // composer를 다시 표시합니다. 이 시점부터 좋아요/재답변/입력창 높이가 실제 레이아웃에 반영됩니다.
        isHistoryRendering.value = false;

        await nextTick();
        if (finishSeq !== historyRenderFinishSeq) return;
        await ui.scrollBottom?.({force: true, behavior: "auto"});

        await waitForNextPaint();
        if (finishSeq !== historyRenderFinishSeq) return;
        await ui.scrollBottom?.({force: true, behavior: "auto"});

        await waitForNextPaint();
        if (finishSeq !== historyRenderFinishSeq) return;
        await ui.scrollBottom?.({force: true, behavior: "auto"});
      } finally {
        if (finishSeq === historyRenderFinishSeq) {
          historyMessagesLoaded.value = false;
          if (historyRenderOverlayActive) {
            apiRequestStore.stopOverlay();
          }
          historyRenderOverlayActive = false;
        }
      }
    };

    void revealAfterPaint();
  }

  // ── 📌 [1. 화면 라우팅 상태 분석 및 권한 가드 파트] ──────────────────
  const currentMode = computed(() => props.mode);
  const isMainPage = computed(() => currentMode.value === "main"); // 대화 서랍이 비어있는 빈 홈 화면 여부
  const isChatPage = computed(() => currentMode.value === "chat"); // 실제 유저 본인의 프라이빗 대화방 여부
  const isSharedPage = computed(() => currentMode.value === "shared"); // URL 공유 링크를 통해 들어온 외부인 열람용 방 여부
  const isConversationPage = computed(
    () => isChatPage.value || isSharedPage.value
  ); // 실제 대화/공유 대화가 실재하는 뷰 포트 구조 판별
  const isReadOnly = computed(() => isSharedPage.value); // 공유 페이지인 경우 하단 인풋 창 타이핑 권한을 차단(박제)

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

  // 현재 활성화된 라우터 세션의 고유 식별자 키(대화방 ID 또는 공유 ID)를 파싱 추출합니다.
  const activeHistoryId = computed(() => {
    if (isChatPage.value) return route.params.id;
    if (isSharedPage.value) return route.params.shareId;
    return null;
  });

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

  // ── 🚀 [3. 라우팅 전환에 따른 메시지 세션 복원 동기화 엔지니어링] ──────────────────
  /**
   * @function loadRouteConversation
   * @description 주소창 라우트 정보가 변경되거나 방을 갈아탈 때, 해당 방의 과거 대화 이력을 로드하고 스크롤 포커싱을 선점 조율합니다.
   */
  async function loadRouteConversation() {
    const loadSeq = ++routeConversationLoadSeq;
    const isCurrentLoad = () => loadSeq === routeConversationLoadSeq;

    // 케이스 1: 홈 메인 로드인 경우 화면 말풍선을 비우고 액티브 대화방 메모리 컨텍스트를 소거합니다.
    if (isMainPage.value) {
      finishHistoryRender();
      clearLazyHistoryMessages();
      messages.value = [];
      chatStore.pruneInactiveMessageCache(null);
      clearActiveSession();
      return;
    }

    try {
      // 케이스 2: 공유 오픈방 열람 페이지인 경우 원격지의 전용 익명 오픈 조회 엔드포인트 파이프라인으로 우회 라우팅합니다.
      if (isSharedPage.value) {
        beginHistoryRender();
        await flushConversationSwitchPaint();
        if (!isCurrentLoad()) return;
        const sharedMessages = await loadSharedConversation(
          activeHistoryId.value
        );
        if (!isCurrentLoad()) return;
        clearLazyHistoryMessages();
        messages.value = sharedMessages;
        historyMessagesLoaded.value = true;
        await nextTick();
        return;
      }

      // 케이스 3: 일반 채팅 모드인데 대상 방의 고유 ID가 식별되지 않는 예외 상황 처리
      if (!activeHistoryId.value) {
        beginHistoryRender();
        await flushConversationSwitchPaint();
        if (!isCurrentLoad()) return;
        clearLazyHistoryMessages();
        clearActiveSession();
        finishHistoryRender();
        return;
      }

      // 케이스 4: 현재 메모리에 인덱싱된 대화 목록 서랍에서 타깃 방 객체를 검증 스캔합니다.
      const history = findHistory(activeHistoryId.value);
      if (!history) {
        clearPendingSelectedOnFailure(activeHistoryId.value);
        finishHistoryRender();
        // 이미 유저가 삭제했거나 권한이 박탈된 방 주소로 악성 인입된 경우 메인 페이지로 튕겨내는 가드를 발동합니다.
        await router.replace({name: "main"}).catch(() => {});
        return;
      }

      // 새 대화 생성 직후 라우터가 chat 화면으로 이동하는 경우에는 기존 대화방 입장용
      // history render overlay를 띄우지 않습니다. 이후 submit 흐름에서 사용자 질문과 기존
      // typing("...") 표시 로직이 즉시 append되므로 빈 방 복원 처리만 조용히 마칩니다.
      if (chatStore.consumePendingNewSubmitChat(history.id)) {
        finishHistoryRender();
        clearPendingSelectedIfMatched(history.id);
        clearLazyHistoryMessages();
        messages.value = runtime.conversations.value?.[history.id] || [];
        historyMessagesLoaded.value = true;
        await nextTick();
        return;
      }

      // 검증이 완료되면 스토어를 호출해 과거 유저와 주고받았던 기 수립 대화 목록을 정형화 로드합니다.
      chatStore.setPendingSelectedChatId(history.id);
      beginHistoryRender();
      const mermaidWarmupPromise = warmupMermaidForHistoryRender().catch(
        () => null
      );
      await flushConversationSwitchPaint();
      if (!isCurrentLoad()) return;
      chatStore.pruneInactiveMessageCache(history.id);
      const loadedMessages = await ensureConversation(history.id);
      if (hasMermaidInHistoryMessages(loadedMessages)) {
        await mermaidWarmupPromise;
      }
      if (!isCurrentLoad()) return;
      setHistoryMessagesForInitialRender(loadedMessages);
      historyMessagesLoaded.value = true;
      clearPendingSelectedIfMatched(history.id);
      await nextTick();
      chatStore.pruneInactiveMessageCache(history.id);
    } catch (error) {
      if (isCurrentLoad()) {
        clearPendingSelectedOnFailure(activeHistoryId.value);
        finishHistoryRender();
      }
      logWarn("[useChatDataController] loadRouteConversation 오류:", error);
    }
  }

  // ── 🎨 [4. 스트리밍 완결 후 서브 텍스트 변환 파이프라인 코어] ──────────────────
  /**
   * @function renderAfterStream
   * @description AI 문장 조각 스트리밍(SSE) 출력이 완결 종료되는 시점에 트리거됩니다.
   * 본문 내 마크다운 다이어그램 문법 블록을 분석해 Mermaid 그래픽 레이아웃을 전격 드로잉 변환 처리하고 스크롤 앵커를 최종 동기화합니다.
   */
  async function renderAfterStream() {
    try {
      if (ui.autoScrollOnAnswer.value) {
        ui.markForceBottom(1000); // 연산 및 컴포넌트 확장 팽창 시간을 고려하여 1000ms 동안 하단 스크롤 잠금 유지
      }

      // 마크다운 컨테이너 내부의 텍스트 코드를 실제 시각적 플로우차트 그래픽 SVG 구조체로 드로잉 치환 렌더링합니다.
      await renderMermaidInElement(document.querySelector(".message-list"), {
        force: true,
      });

      // 자동 스크롤 ON은 기존처럼 하단을 추적합니다.
      // OFF 상태에서는 질문 직후 1회만 사용자 질문으로 이동하고, 스트림/마크다운/머메이드
      // 후처리 단계에서는 더 이상 위치를 강제하지 않습니다. 그래야 답변 생성 중 사용자가
      // 아래로 스크롤했을 때 다시 질문 위치로 끌려 올라가지 않습니다.
      if (ui.autoScrollOnAnswer.value) {
        ui.scrollBottom({force: true, stable: true, autoAnswer: true});
      }
    } catch (error) {
      logWarn("[useChatDataController] renderAfterStream 오류:", error);
    }
  }

  // ── [5. 비동기 프롬프트 질문 전송 코어 브릿지 바인딩] ──────────────────
  const chatStreamStore = useChatStreamStore();
  const {isStreaming} = storeToRefs(chatStreamStore);

  const {
    isGenerating: isSubmitGenerating,
    submit,
    regenerate,
  } = useChatSubmit({
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
    canWrite: () => !isReadOnly.value && !isActiveModelUnavailable.value, // 현재 전송 가능 상태 가드 밸리데이션 검증식
    isReadOnly,
    isActiveModelUnavailable,
    markNewSubmitConversation:
      chatStore.markPendingNewSubmitChat.bind(chatStore),
  });

  const isGenerating = computed(
    () => isSubmitGenerating.value || isStreaming.value
  );

  // ── 👀 [6. 반응형 런타임 데이터 이벤트 왓처 버스 맵핑] ──────────────────
  /**
   * @function bindDataEvents
   * @description 라우트 주소 변경 및 스토어 백그라운드 메시지 갱신 내역을 감시하는 반응형 리스너 버스를 개통합니다.
   */
  function bindDataEvents() {
    // 왓처 A: 사용자가 URL 주소를 바꾸거나 뒤로가기/앞으로가기 및 메인 전환 모션을 취할 시 감지하여 세션 복원 함수를 호출합니다.
    watch(
      () => [route.params.id, route.params.shareId, currentMode.value],
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
      historyRenderFinishSeq += 1;
      if (historyRenderOverlayActive) {
        apiRequestStore.stopOverlay();
        historyRenderOverlayActive = false;
      }
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
    historyLazyTopThreshold: computed(() => systemSettingsStore.historyLazyTopThreshold),
    loadPreviousHistoryMessages,
    finishHistoryRender,
    submit,
    regenerate,
    bindDataEvents,
    initializeDataController,
  };
}
