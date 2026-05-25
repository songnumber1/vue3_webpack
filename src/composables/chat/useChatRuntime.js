import {computed} from "vue";
import {storeToRefs} from "pinia";
import {createId} from "@/utils/id";
import {logWarn} from "@/utils/logger";
import {
  bootstrapChatRuntime,
  createChatHistory,
  deleteChatHistory,
  loadChatHistoryList,
  loadChatMessages,
  loadExamplePrompts,
  renameChatHistory,
  updateChatBookmark,
} from "@/composables/app/chatBootstrap";
import {useAppRuntimeStore} from "@/stores/appRuntimeStore";
import {useAssistantStore} from "@/stores/assistantStore";
import {useAuthStore} from "@/stores/authStore";
import {useChatStore} from "@/stores/chatStore";
import {adaptChatHistory} from "@/adapters/chatAdapter";
import {notifyChatHistorySyncFailed} from "@/utils/chatHistorySyncFeedback";

/**
 * [순수 유틸리티 함수] 클라이언트(로컬) 단에서 즉시 채팅을 시작할 때 사용하는 임시 대화방 레코드 객체를 생성합니다.
 * @param {Object} context - 대화방 초기 정보 소스
 * @param {string} context.text - 최초 입력된 프롬프트 내용 (방 제목 힌트)
 * @param {Object} context.assistant - 현재 활성화된 AI 어시스턴트 메타데이터
 * @param {Object} context.model - 현재 선택된 AI 거대모델 메타데이터
 * @returns {Object} 로컬 캐시용 가짜(Temporary) 히스토리 오브젝트
 */
function createLocalHistory({text, assistant, model}) {
  const id = `chat-local-${Date.now()}`; // 중복 방지를 위한 로컬 타임스탬프 기반 가상 ID

  return {
    id,
    temporary: true, // 서버 미등록 로컬 상태임을 나타내는 플래그
    syncStatus: "local", // 동기화 상태 구분 키
    title: text || "New chat", // 사이드바 노출용 타이틀
    preview: text || "New conversation from attachments",
    modelId: model?.id || "",
    assistantId: assistant?.id || model?.assistId || "",
    assistantType: assistant?.type || "",
    assistantLabel: assistant?.label || "",
    modelLabel: model?.label || "",
    isPinned: false, // 북마크 고정 여부 (초기값 false)
    endedAt: new Date().toISOString(),
    userId: "",
    raw: null, // 원본 백엔드 응답 데이터 슬롯
  };
}

/**
 * [순수 유틸리티 함수] 특정 대화 이력(History) 데이터와 마스터 메타 맵을 대조 및 파싱하여, 현재 런타임에서 안전하게 통제할 액티브 세션 구조체를 빌드합니다.
 * 특히 과거에 썼던 특정 모델이 관리자에 의해 삭제되었거나 서비스 대상에서 제외(Missing)되었는지 정밀 검사합니다.
 * @param {Object} history - 변환 타깃이 되는 단일 대화방 이력 객체
 * @param {Object} [modelMap={}] - 전체 AI 모델 매핑 정보 데이터 셋
 * @param {Object} [assistantMap={}] - 전체 AI 어시스턴트 매핑 정보 데이터 셋
 * @returns {Object|null} 유효성 판별 검증 데이터가 합산된 런타임 세션 객체
 */
function createSessionFromHistory(history, modelMap = {}, assistantMap = {}) {
  if (!history) return null;

  const model = modelMap[history.modelId] || null;
  const assistant =
    assistantMap[history.assistantId || model?.assistId] || null;

  // 상태 변질 우려 검증 3단계 디텍팅 플래그 수립
  const modelMissing = Boolean(history.modelId && !model); // 역사엔 존재하나 마스터 맵엔 없는 경우
  const assistantMissing = Boolean(
    (history.assistantId || model?.assistId) && !assistant
  );
  const modelDeleted = Boolean(model?.isDeleted); // 마스터 맵엔 존재하나 삭제 마킹 처리된 경우

  // 최종 사용 불가 사유 텍스트 코드를 수립합니다.
  const unavailableReason = modelDeleted
    ? "deleted"
    : modelMissing
      ? "missing-model"
      : assistantMissing
        ? "missing-assistant"
        : "";

  return {
    chatId: history.id,
    assistantId: assistant?.id || history.assistantId || model?.assistId || "",
    assistantType: assistant?.type || history.assistantType || "",
    assistantLabel: assistant?.label || history.assistantLabel || "",
    modelId: model?.id || history.modelId || "",
    modelName: model?.label || history.modelLabel || "",
    modelType: model?.type || "",
    isModelDeleted: modelDeleted,
    isModelMissing: modelMissing,
    isAssistantMissing: assistantMissing,
    isModelUnavailable: Boolean(unavailableReason), // 사용 불가 상황 판단 최종 불리언
    modelUnavailableReason: unavailableReason,
    displayAssistantId: "",
    displayAssistantLabel: "",
    readonlyModel: true, // 대화 도중 모델 변조 차단용 플래그
  };
}

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
   * [액션 2] 백엔드 최신 상태를 강제 풀링하여 사이드바의 대화 히스토리 목록 배열을 최신 상태로 강제 재인화(Refresh)합니다.
   * @param {Object} [options={}] - 디테일 에러 피드백 제어 옵션
   * @param {boolean} options.notifyOnError - 통신 오류 발생 시 화면 우측에 알림 토스트를 띄울지 여부
   * @returns {Promise<Array>} 최신화 완료된 히스토리 배열 목록
   */
  async function refreshHistories({notifyOnError = false} = {}) {
    try {
      const chatHistories = await loadChatHistoryList({
        assistantMap: assistantStore.assistantMap,
        modelMap: assistantStore.modelMap,
      });
      chatStore.setHistories(chatHistories); // Pinia 스토어 전격 동기화 대체
      return chatHistories;
    } catch (error) {
      logWarn("[useChatRuntime] refreshHistories 오류:", error);
      if (notifyOnError) await notifyChatHistorySyncFailed(error); // 토스트 레이어 연동 피드백 알림
      return chatStore.histories; // 실패 시 기존 메모리 상의 구버전 데이터를 폴백 유지 반환
    }
  }

  /**
   * [액션 3] 유저가 대화방을 지우거나 이름을 바꾸는 행동 시, UI상의 반응형 화면 처리를 가로막지 않도록 백그라운드 비동기 쓰레드 형태로 무중단 동기화를 집행하는 내부 오케스트레이션 헬퍼입니다.
   * @param {Object} [options={}] - 동기화 옵션 패키지
   */
  function syncHistoriesInBackground(options = {}) {
    Promise.resolve()
      .then(() => refreshHistories(options))
      .catch((error) => {
        logWarn("[useChatRuntime] syncHistoriesInBackground 오류:", error);
      });
  }

  /**
   * [액션 4] 특정 대화 히스토리 항목의 상단 북마크 고정(Pin/Unpin) 상태를 원격 토글 처리합니다.
   * 선제적 백그라운드 싱크 예약을 걸어 레이스 컨디션을 미연에 차단합니다.
   * @param {Object} history - 고정/해제 대상 대화 히스토리 객체
   */
  async function toggleHistoryBookmark(history) {
    if (!history?.id) return;
    try {
      syncHistoriesInBackground({notifyOnError: true}); // 사전 비동기 정합성 조율 시도
      await updateChatBookmark({
        chatId: history.id,
        bookmarkYN: !history.isPinned, // 현재 고정 상태의 반대 논리값 투척 (토글)
      });
      syncHistoriesInBackground({notifyOnError: true}); // 완결 후 사후 리스트 최신화
    } catch (error) {
      logWarn("[useChatRuntime] toggleHistoryBookmark 오류:", error);
      throw error;
    }
  }

  /**
   * [액션 5] 유저가 수정한 텍스트 명칭을 대화방의 새로운 실제 대외적 방 타이틀 이름으로 변경 및 반영 보존합니다.
   * @param {Object} history - 이름 변경 타깃 히스토리 객체
   * @param {string} title - 새롭게 덮어씌울 신규 문자열 명칭
   */
  async function renameHistory(history, title) {
    const chatTitle = String(title || "").trim();
    if (!history?.id || !chatTitle) return;
    try {
      syncHistoriesInBackground({notifyOnError: true});
      await renameChatHistory({chatId: history.id, chatTitle});
      syncHistoriesInBackground({notifyOnError: true});
    } catch (error) {
      logWarn("[useChatRuntime] renameHistory 오류:", error);
      throw error;
    }
  }

  /**
   * [액션 6] 사용자가 특정 대화방 삭제 명령을 내렸을 때 시스템 인메모리 맵 및 원격 DB 레포지토리 양측에서 영구 소멸 소거 처리를 감행합니다.
   * @param {Object} history - 소멸 폐기 처리할 대화 히스토리 대상 객체
   */
  async function removeHistory(history) {
    if (!history?.id) return;
    try {
      syncHistoriesInBackground({notifyOnError: true});
      // 원격 저장소 레코드 영구 삭제 명령 전송
      await deleteChatHistory({chatId: history.id});
      // 프론트엔드 로컬 인메모리 메시지 캐시 딕셔너리에서 해당 대화방 고유 키 슬롯을 완벽히 도려냅니다.
      delete chatStore.messageMap[history.id];

      // 만약 유저가 현재 눈으로 보며 대화 중이던 바로 그 방을 삭제한 상황이라면, 세션 강제 폭파 및 홈 화면 복귀 유도를 유발합니다.
      if (String(chatStore.selectedChatId) === String(history.id)) {
        chatStore.clearActiveSession();
      }
      syncHistoriesInBackground({notifyOnError: true});
    } catch (error) {
      logWarn("[useChatRuntime] removeHistory 오류:", error);
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
   * [액션 8-1 서브 래퍼] 완전히 비어있는 새 대화 홈 화면 모드 상태에서 어시스턴트를 교체할 때 직관적으로 바인딩하는 단축 특화 포워더 함수입니다.
   */
  function selectAssistantForNewChat(id) {
    return selectAssistant(id, {forNewChat: true});
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
      const messages = await loadChatMessages({
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
   * 외부 스트리밍 가드 등에서 가공 완료한 정형화 메시지 배열을 스토어 특정 슬롯 채널에 강제 오버라이트 동기화시키는 동기식 주입 유틸입니다.
   */
  function setConversation(historyId, messages) {
    chatStore.setMessages(historyId, messages);
  }

  /**
   * [액션 11] 백엔드 영구 저장소 원격 채널 서버에 실제 API 통신 노크를 하여 공식 신규 대화방 세션을 최초 수립(new.do) 및 발급받아 안착시키는 원격 룸 빌더 함수입니다.
   * @param {Object} context - 신규 개설 비즈니스 메타 소스
   * @returns {Promise<Object>} 원격 어댑팅 처리가 최종 완결된 신규 히스토리 인스턴스 단일 객체
   */
  async function createRemoteConversation({text, assistantId, modelId} = {}) {
    const requestId = createId("request"); // 통신 추적용 유니크 트래킹 키 발급

    // 백엔드 데이터베이스 엔드포인트에 룸 신규 영구 개설 API 패킷을 송출합니다.
    const rawHistory = await createChatHistory({
      request_id: requestId,
      requestId,
      assistantId,
      assistId: assistantId,
      modelId,
      input: text,
      chatTitle: text,
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

  /** [액션 13] 현재 매핑된 액티브 대화 세션 정보창 관계를 해제하고 완전 청소 상태(초기 상태)로 원복 시킵니다. */
  function clearCurrentChatSelection() {
    chatStore.clearActiveSession();
  }

  /**
   * [가비지 컬렉션 GC 유틸] 파일 첨부 등을 통해 브라우저 메모리 힙(Heap) 상에 생성되어 잔존해 있던 인메모리 임시 프리뷰 이미지 URL 바이너리 블롭 락 오브젝트들을 완전히 영구 해제(`revokeObjectURL`)하여 프론트엔드 메모리 누수(Memory Leak) 장애를 원천 차단 청소합니다.
   * @param {Array} [items=[]] - 검사 대상이 될 타깃 메시지 말풍선 배열 묶음
   */
  function revokeMessageAttachments(items = []) {
    items.forEach((message) => {
      if (!Array.isArray(message.attachments)) return;
      message.attachments.forEach((file) => {
        // 프리뷰 참조용 브라우저 로컬 blob 가상 주소 패턴 스트링 문자열 구조인지 정밀 매칭 검사합니다.
        if (file?.url?.startsWith?.("blob:")) {
          URL.revokeObjectURL(file.url); // 운영체제 가상 메모리 반환 및 힙 메모리 영구 폐기 소거 처리
        }
      });
    });
  }

  /**
   * [액션 14] 프롬프트 서브밋 전송 발생 직후, 유저가 방금 기재한 질문 데이터 인스턴스와 AI가 타이핑을 쳐내려갈 스트리밍 대기 빈 인스턴스 2개를 동시에 생성하여 대화 리스트 배열 꼬리에 즉시 융합 결합해 주는 화면 즉각 반영용 고속 인젝터 메서드입니다. (Optimistic UI 렌더링 패턴 핵심부)
   * @param {string} chatId - 대상 대화방 ID
   * @param {Object} normalized - {@link usePromptComposer} 단에서 정문화되어 넘어온 유저 프롬프트 본체 메타 패키지
   * @returns {Object} 스냅샷으로 가공 갱신 처리된 차기 메시지 토탈 배열 및 실시간 업데이트 타깃이 될 어시스턴트 반응성 포인터 레퍼런스
   */
  function appendUserAndAssistantMessages(chatId, normalized) {
    const currentMessages = chatStore.messageMap[chatId] || [];

    // 1차 패킹: 사용자 발송 질문 말풍선 인스턴스 구축
    const userMessage = {
      id: createId("message"),
      role: "user",
      content: normalized.text,
      attachments: normalized.attachments,
      createdAt: new Date().toISOString(),
    };

    // 2차 패킹: AI가 SSE 채널로 조각 텍스트를 채워 넣을 스트리밍 빈 그릇 어시스턴트 인스턴스 구축
    const assistantMessage = {
      id: createId("message"),
      role: "assistant",
      content: "",
      reasoningContent: "", // 추론 텍스트 적립용 빈 슬롯
      reasoningStatus: "thinking", // 초동 포커스는 우선 '생각 중' 상태 레이아웃으로 기동 선언
      status: "streaming", // 현재 진행형 모드 상태 고정
      createdAt: new Date().toISOString(),
    };

    // 기존 불변 메시지 배열 복사본 뒤에 신규 타깃 2쌍을 깔끔하게 이어붙여 차기 최종 가상 상태 배열을 도출합니다.
    const nextMessages = [...currentMessages, userMessage, assistantMessage];
    chatStore.setMessages(chatId, nextMessages); // 즉시 뷰 렌더링 트리거 레이아웃 동기화 완료

    return {messages: nextMessages, assistantMessage};
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
    selectAssistantForNewChat,
    ensureConversation,
    setConversation,
    createRemoteConversation,
    createLocalConversation,
    clearCurrentChatSelection,
    appendUserAndAssistantMessages,
    revokeMessageAttachments,
  };
}
