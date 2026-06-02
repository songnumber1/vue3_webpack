/**
 * @file composables/chat/useChatRuntime.js
 * @description 채팅 도메인 composable입니다. 질문 전송, 메시지 동기화, SSE 결과 반영, scroll/overlay action을 담당합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed} from "vue";
import {storeToRefs} from "pinia";
import {createId} from "@/utils/id";
import {logWarn} from "@/utils/logger";
import {
  bootstrapChatRuntime,
  createChatHistory,
  loadChatMessageRouters,
  loadExamplePrompts,
} from "@/composables/app/chatRuntimeBootstrap";
import {useAppRuntimeStore} from "@/stores/appRuntimeStore";
import {useAssistantStore} from "@/stores/assistantStore";
import {useAuthStore} from "@/stores/authStore";
import {useChatStore} from "@/stores/chatStore";
import {adaptChatHistory} from "@/adapters/chatAdapter";
import {
  createLocalHistory,
  createSessionFromHistory,
} from "@/composables/chat/runtime/chatSessionFactory";
import {
  appendUserAndAssistantMessages as appendMessagesToChat,
  revokeMessageAttachments,
} from "@/composables/chat/runtime/useMessageAppender";
import {createChatHistoryRuntime} from "@/composables/chat/runtime/useChatHistoryRuntime";

/**
 * [Chat runtime facade]
 * Pinia store, API bootstrap, assistant/model/history 선택 상태를 ChatContainer controller가 쓰기 쉬운 형태로 묶습니다.
 * business state는 store에 남기고, 여기서는 화면 orchestration에 필요한 action만 조립합니다.
 */

/**
 * 애플리케이션의 핵심 대화 파이프라인 가동, 무중단 히스토리 동기화 및 렌더링 세션 활성화를 주도하는 전역 런타임 컴포저블입니다.
 * @returns {Object} 채팅 레이아웃 및 네비게이션 서브 시스템에서 참조할 상태 세트 및 액션 핸들러 인터페이스
 * @see {@link bootstrapChatRuntime} 최초 시스템 구동 시 유저 권한 및 대화 목록을 한 번에 가져오는 결합 부트스트랩 API
 * @see {@link useChatStore} 개별 메시지 맵 및 활성 세션을 영구 보존하는 Pinia 대화 코어 스토어
 * @see {@link useAssistantStore} 서비스 가능한 인프라 AI 모델 및 페르소나 어시스턴트 전용 매스터 스토어
 */
export function useChatRuntime() {
  // 시스템 인프라 전역 상태 스토어 군집 통합 풀링
  const appRuntimeStore = useAppRuntimeStore();
  const authStore = useAuthStore();
  const assistantStore = useAssistantStore();
  const chatStore = useChatStore();

  // 구조분해 Destructuring으로 인한 리액티비티(반응성) 깨짐을 방지하기 위해 storeToRefs 래핑 적용
  const {assistants, selectedAssistantId, selectedModelId, examplePromptMap} =
    storeToRefs(assistantStore);
  const {histories} = storeToRefs(chatStore);
  const {
    refreshHistories,
    syncHistoriesInBackground,
    toggleHistoryBookmark,
    renameHistory,
    removeHistory,
  } = createChatHistoryRuntime({assistantStore, chatStore});

  /** [Computed] 현재 선택된 메인 어시스턴트 객체를 반환하며, 유실 시 0번째 기본 어시스턴트 객체로 자동 폴백합니다. */
  const currentAssistant = computed(
    () =>
      assistantStore.currentAssistant ||
      assistants.value[0] || {id: "", label: "Assistant", description: ""}
  );

  /** [Computed] 현재 활성화된 AI 페르소나와 매핑되어 매칭된 추천 예시 질문 칩(Example Chips) 배열 목록입니다. */
  const currentExamplePrompts = computed(
    () => examplePromptMap.value[selectedAssistantId.value] || []
  );

  /** [Computed] 현재 사용자가 모니터링하며 진입해 있는 방의 활성 런타임 세션 메타 객체입니다. */
  const activeSession = computed(() => chatStore.activeSession);

  /** [Computed] 활성화된 채팅방의 탑재 모델이 원격 백엔드 상에서 영구 소멸/삭제되었는지 여부 플래그 */
  const isActiveModelDeleted = computed(() =>
    Boolean(chatStore.activeSession?.isModelDeleted)
  );

  /** [Computed] 모델 유실 및 삭제 등으로 인해 현재 방에서 더 이상 정상 스트리밍 생성이 불가능한 상태인지 여부 플래그 */
  const isActiveModelUnavailable = computed(() =>
    Boolean(chatStore.activeSession?.isModelUnavailable)
  );

  /** [Computed] 대화창 내부 셀렉트박스에 뿌려줄 가동 모델 리스트입니다. 방 자체의 모델 잠금 상태에 따라 동적 필터링됩니다. */
  const models = computed(() => {
    // 모델 스위칭이 잠겨있지 않다면(예: 새 대화창 등) 어시스턴트가 제공 가능한 전체 모델 라인업을 반환합니다.
    if (!chatStore.isModelLocked) return assistantStore.currentModels;

    // 이미 대화가 기 진행되어 잠긴 상태라면 오직 해당 방 세션에 바인딩되어 잠긴 모델 단 한 개만 단일 배열로 추려 노출합니다.
    return [assistantStore.modelMap[chatStore.activeSession?.modelId]].filter(
      Boolean
    );
  });

  /** [Computed 양방향 Getter/Setter] 현재 선택 가동 중인 모델 ID 바인딩 셋입니다. */
  const selectedModel = computed({
    get: () => chatStore.activeSession?.modelId || selectedModelId.value,
    set: (id) => {
      if (chatStore.isModelLocked) return; // 이미 기 생성된 대화방 규칙으로 락이 걸린 상태라면 모델 강제 변경을 방지합니다.
      assistantStore.selectModel(id);
    },
  });

  /** [Computed] 기존 대화 기록 진입으로 인해 프론트엔드 단의 모델 변경 권한이 동결 락 상태에 놓였는지 여부 */
  const isModelLocked = computed(() => chatStore.isModelLocked);

  /** [Computed] 전체 대화방들의 개별 메시지 데이터들을 담고 있는 고유 Key-Value 맵 구조체 객체입니다. */
  const conversations = computed(() => chatStore.messageMap);

  /**
   * [액션 1] 서비스 메인 인입 시점에 유저의 최신 권한 세션 및 대화방 이력을 동시 확보하여 애플리케이션의 시동을 거는 부트스트랩 핵심 초기화 함수입니다.
   */
  async function initialize() {
    // 중복 기동 방지 혹은 이미 비동기 로딩 파이프라인이 돌고 있는 상태라면 인터셉트하여 탈출합니다.
    if (appRuntimeStore.initialized || appRuntimeStore.loading) return;

    appRuntimeStore.startLoading(); // 전역 스플래시 인디케이터 기동
    try {
      // 1. 초기 연동 대형 번들 API 데이터 셋을 단 한 번의 비동기 호출로 수집합니다.
      const data = await bootstrapChatRuntime({
        accessInfoOverride: authStore.accessInfo || null,
      });

      // 2. 수집된 최신 유저 세션 인증 상태를 판별하여 글로벌 보안 스토어에 보존합니다.
      if (data.accessInfo?.user) {
        authStore.setAuthenticatedAccessInfo(data.accessInfo);
      } else {
        authStore.setAccessInfo(data.accessInfo);
      }

      // 3. 어시스턴트 목록, 마스터 모델 딕셔너리 정보 등을 인메모리 스토어에 마운트 동기화합니다.
      assistantStore.setBootstrapData(data);
      // 4. 사이드바에 노출할 유저의 최신 대화 목록 리스트를 세팅합니다.
      chatStore.setHistories(data.chatHistories);

      appRuntimeStore.finishLoading(); // 전역 스플래시 종료 처리 및 앱 활성화 완료 통보
    } catch (error) {
      appRuntimeStore.fail(error); // 인프라 다운 예외 처리 화면 스위칭 트리거
      throw error;
    }
  }

  /**
   * [액션 7] 특정 AI 어시스턴트가 가용할 수 있는 고유 템플릿 추천 칩(Prompts) 목록 데이터가 캐시에 없을 때만 비동기로 사전 예비 수집(Preload)해 옵니다.
   * @param {string} assistantId - 어시스턴트 고유 식별 키
   */
  async function preloadExamplePrompts(assistantId) {
    if (!assistantId || assistantStore.examplePromptMap[assistantId]) return; // 이미 인메모리 캐시에 실재한다면 호출 생략
    try {
      const assistant = assistantStore.assistantMap[assistantId];
      const prompts = await loadExamplePrompts({
        assistantId,
        studioYN: assistant?.type === "studio", // 커스텀 스튜디오 룸 여부 삼항 필터링 분기
      });
      assistantStore.setExamplePrompts(assistantId, prompts); // 전역 맵 적립 보존
    } catch (error) {
      logWarn("[useChatRuntime] preloadExamplePrompts 오류:", error);
    }
  }

  /**
   * [액션 8] 유저가 사이드바나 헤더에서 대화 대상을 다른 AI 어시스턴트 페르소나 객체로 스위칭 전환 선택했을 때의 메인 헨들러입니다.
   * @param {string} id - 변경 타깃이 되는 어시스턴트 ID
   * @param {Object} [options={forNewChat:false}] - 새 대화방 개설 전제 상태 분기 옵션
   */
  async function selectAssistant(id, {forNewChat = false} = {}) {
    if (!forNewChat && chatStore.isModelLocked) return; // 이미 기존 방 락 조건에 걸려있다면 어시스턴트 무단 강제 변조를 거부합니다.
    try {
      assistantStore.selectAssistant(id); // 선택 모델 상태값 업데이트
      if (forNewChat) chatStore.clearActiveSession(); // 완전히 새로운 룸 생성 전제 하라면 기존 방 바인딩 데이터 클리어 제거
      await preloadExamplePrompts(id); // 변경된 페르소나의 추천 프롬프트 데이터 긴급 패치 예비 기동
    } catch (error) {
      logWarn("[useChatRuntime] selectAssistant 오류:", error);
    }
  }

  /**
   * [액션 10] 사용자가 특정 과거 대화방을 클릭하여 진입(라우팅 이동)했을 때, 해당 방의 대화 말풍선 히스토리 전체를 로드하고
   * 유효 세션 검증 상태(모델 삭제 여부 등)를 진단하여 방 내부 컴포넌트 환경을 최종 안착 연동해 주는 핵심 세션 수립 진입 함수입니다.
   * @param {string} historyId - 진입 타깃 대화방 ID
   * @returns {Promise<Array>} 최종 수집되어 화면에 즉시 그려질 유저-AI 대화 말풍선 메시지 전체 배열
   */
  async function ensureConversation(historyId) {
    const history = chatStore.getHistory(historyId);
    if (!history) return []; // 메모리 상에 해당 대화 역사가 통째로 실재하지 않는다면 이상 상황이므로 빈 배열 반환 탈출

    // 1. 해당 히스토리 기반 원본 소스를 검사하여 모델 탈락/유실 여부가 합산된 정밀 런타임 세션 구조체를 축조합니다.
    const session = createSessionFromHistory(
      history,
      assistantStore.modelMap,
      assistantStore.assistantMap
    );

    const fallbackAssistant = assistantStore.assistants[0] || null; // 인프라 붕괴 방지용 0순위 원초적 기본형 대안 어시스턴트 선점

    // 검증 결과: 사용하던 AI 모델이 소멸했거나, 세션 구조상 어시스턴트 바인딩 링크가 통째로 깨져 실재하지 않는 위험 상태라면 폴백 가동을 선언합니다.
    const shouldUseFallbackAssistant = Boolean(
      session?.isModelDeleted ||
      session?.isModelMissing ||
      session?.isAssistantMissing ||
      !session?.assistantId
    );

    // 폴백 모드가 켜졌다면 강제로 기본형 페르소나(displayAssistant)를 강제 배정하여 화면 크래시를 방어합니다.
    const displayAssistant = shouldUseFallbackAssistant
      ? fallbackAssistant
      : assistantStore.assistantMap[session.assistantId] || fallbackAssistant;

    if (displayAssistant?.id) {
      assistantStore.selectAssistant(displayAssistant.id); // 글로벌 인프라 포커스 강제 스위칭
      session.displayAssistantId = displayAssistant.id; // 화면 보정 표기용 닉네임 ID 매핑 임베딩
      session.displayAssistantLabel = displayAssistant.label;
    }

    // 2. 검증 보정 세팅이 완료된 액티브 세션 객체를 최종 기동 상태로 격상 안착시킵니다.
    chatStore.setActiveSession(session);

    // 3. 만약 해당 방의 대화 말풍선 메시지 내용물들이 로컬 메모리 배열 맵에 로드된 적이 없는 순수 미개봉 상태라면 비동기 API 요청을 통해 긁어옵니다.
    if (!chatStore.messageMap[history.id]) {
      const messages = await loadChatMessageRouters({
        chatId: history.id,
        assistId: session?.assistantId || history.assistantId,
        modelId: session?.modelId || history.modelId,
        studio: session?.assistantType === "studio",
      });
      chatStore.setMessages(history.id, messages); // 스토어 인메모리 배열 슬롯 장착 완결
    }

    return chatStore.messageMap[history.id] || [];
  }

  /**
   * [액션 11] 백엔드 영구 저장소 원격 채널 서버에 실제 API 통신 노크를 하여 공식 신규 대화방 세션을 최초 수립(new.do) 및 발급받아 안착시키는 원격 룸 빌더 함수입니다.
   * @param {Object} context - 신규 개설 비즈니스 메타 소스
   * @returns {Promise<Object>} 원격 어댑팅 처리가 최종 완결된 신규 히스토리 인스턴스 단일 객체
   */
  async function createRemoteConversation({text, assistantId, modelId} = {}) {
    const chatId = createId(); // new.do 요청 시점에 채팅방 ID를 UUID로 선발급합니다.
    const chatTitle = String(text || "")
      .trim()
      .slice(0, 20);
    const assistant = assistantStore.assistantMap?.[assistantId] || null;

    // 백엔드 데이터베이스 엔드포인트에 룸 신규 영구 개설 API 패킷을 송출합니다.
    const rawHistory = await createChatHistory({
      chatId,
      assistId: assistantId,
      modelId,
      ChatTilte: chatTitle || String(text || "").trim(),
      studio: assistant?.type === "studio",
    });

    // 수신된 거친 백엔드 규격 응답 데이터 구조를 프론트엔드 표준 규격 객체로 정형화(Adapting) 통일합니다.
    const history = adaptChatHistory(rawHistory, {
      assistantMap: assistantStore.assistantMap,
      modelMap: assistantStore.modelMap,
    });

    if (!history?.id) {
      throw new Error("new.do response does not contain chatId."); // 방 고유 식별 번호 누락 장애 복구 예외 처리
    }

    // 새방 개설 완결에 따라 Pinia 내부 리스트 및 세션을 공식 런타임 활성 레벨로 안착 적립 시킵니다.
    chatStore.addHistory(history);
    chatStore.setMessages(history.id, []); // 초기 대화 말풍선 리스트는 깨끗하게 빈 배열 슬롯으로 개통
    chatStore.setActiveSession(
      createSessionFromHistory(
        history,
        assistantStore.modelMap,
        assistantStore.assistantMap
      )
    );

    return history;
  }

  /**
   * [액션 12] 비로그인 유저 환경이나 로컬 오프라인 전용 게스트 모드 작동 시, 서버 통신 없이 브라우저 메모리 단독으로 임시 신규 대화방 서랍을 빌드합니다.
   */
  function createLocalConversation({text} = {}) {
    const history = createLocalHistory({
      text,
      assistant: assistantStore.currentAssistant,
      model: assistantStore.currentModel || assistantStore.currentModels[0],
    });
    chatStore.addHistory(history);
    chatStore.setMessages(history.id, []);
    chatStore.setActiveSession(
      createSessionFromHistory(
        history,
        assistantStore.modelMap,
        assistantStore.assistantMap
      )
    );

    return history;
  }

  function appendUserAndAssistantMessages(chatId, normalized) {
    return appendMessagesToChat({chatStore, chatId, normalized});
  }

  // 최상위 대화 인터페이스 쉘 및 컨테이너 프레임워크 컴포넌트 뷰 영역 전체에서 호출 가동할 수 있도록 총괄 자원을 누수 없이 최종 노출 반환합니다.
  return {
    initialize,
    assistants,
    currentAssistant,
    currentExamplePrompts,
    histories,
    models,
    activeSession,
    selectedAssistantId,
    selectedModel,
    isModelLocked,
    isActiveModelDeleted,
    isActiveModelUnavailable,
    conversations,
    refreshHistories,
    syncHistoriesInBackground,
    toggleHistoryBookmark,
    renameHistory,
    removeHistory,
    selectAssistant,
    ensureConversation,
    setMessages: chatStore.setMessages.bind(chatStore),
    createRemoteConversation,
    createLocalConversation,
    clearActiveSession: chatStore.clearActiveSession.bind(chatStore),
    appendUserAndAssistantMessages,
    revokeMessageAttachments,
  };
}
