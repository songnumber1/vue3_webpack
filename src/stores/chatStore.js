/**
 * @file stores/chatStore.js
 * @description Pinia 전역 상태 저장소입니다. 화면 간 공유되어야 하는 business/runtime 상태를 관리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {defineStore} from "pinia";

// 대화방 세션이 완전히 생성되기 전, 인풋창 영역에서 세팅을 조작할 때 가상 바인딩할 임시 임시 버퍼 키 고정값
const DRAFT_PROMPT_TOOL_SETTINGS_KEY = "__draft__";

// 확장 도구 메뉴들의 표준 공장 초기화 설정 맵 구조체 (불변 보존을 위해 Object.freeze 하드락 동결)
const DEFAULT_PROMPT_TOOL_SETTINGS = Object.freeze({
  knowledgeSearch: [], // 내부 사내 문서 지식 데이터베이스(RAG) 검색 필터 범위 타깃 어레이
  webSearch: null, // 실시간 웹 브라우징 외부 검색 엔진 지정 상세 키 사양
  webSearchEnabled: false, // 웹 서치 크롤러 허브 기능 동적 점등 활성화 플래그
  promptTemplateId: null, // 결합 선택된 시스템 프롬프트 어시스턴트 템플릿의 ID 명세
  promptTemplateOptions: {}, // 템플릿 내부에 동적 조립 변수로 인입될 라디오/체크 옵션 적치 버퍼 맵
});

/**
 * 객체 참조 복사로 인한 버그를 완벽히 격리 방어하기 위해 도구 세팅 구조체를
 * 딥 카피 수준으로 완벽하게 분리 복제 빌드해 주는 순수 헬퍼 가공식입니다.
 */
function clonePromptToolSettings(settings = {}) {
  return {
    knowledgeSearch: Array.isArray(settings.knowledgeSearch)
      ? [...settings.knowledgeSearch]
      : [],
    webSearch: settings.webSearch || null,
    webSearchEnabled: Boolean(settings.webSearchEnabled),
    promptTemplateId: settings.promptTemplateId || null,
    promptTemplateOptions: {...(settings.promptTemplateOptions || {})},
  };
}

/**
 * @description 활성 대화방 리스트, 메시지 버퍼, 그리고 입력창 툴바 옵션 세팅 맵을 통합 중계 보존하는 챗 비즈니스 코어 스토어입니다.
 */
export const useChatStore = defineStore("chat", {
  // 실시간 다이나믹 채팅 상태 데이터 세트 명세
  state: () => ({
    histories: [], // 좌측 히스토리 보드에 빌드 렌더링될 과거 대화방 마스터 리스트 배열
    selectedChatId: null, // 현재 화면 중앙 영역을 장악 중인 메인 룸 고유 Chat ID 식별자
    activeSession: null, // 백엔드 세션 소켓 커넥션 정보 및 읽기 전용 가드 상태 믹스드 객체
    messageMap: {}, // 챗방 ID를 최상위 키로 삼아 대화 말풍선 어레이 목록을 캐시 보존하는 거대 레포지토리
    promptToolSettingsMap: {}, // 챗방 ID별로 유저가 커스텀 커스터마이징해 둔 툴바 확장 옵션 정보 보관함
    pendingNewSubmitChatIds: {}, // 메인 새 대화 submit 직후 라우트 전환 시 기존 대화방 hydration overlay/scroll을 건너뛰기 위한 일회성 플래그 맵
  }),
  getters: {
    /**
     * 현재 선택 상태인 단일 대화방 레코드 정보 스냅샷을 히스토리 목록에서 정밀 서칭합니다.
     */
    activeHistory: (state) =>
      state.histories.find(
        (item) => String(item.id) === String(state.selectedChatId)
      ) || null,
    /**
     * 현재 열려있는 챗방 ID 소유의 실시간 대화 말풍선(메시지) 배열 팩을 추출하여 뷰포트에 공유 노출합니다.
     */
    activeMessages: (state) =>
      state.selectedChatId ? state.messageMap[state.selectedChatId] || [] : [],
    /**
     * 특정 챗방이 히스토리 박제 형태 또는 이미 완료 처리되어 AI 모델 사양을 유저가 도중에 함부로 가로채 교체할 수 없도록 강제 락을 걸었는지 확인하는 판별식입니다.
     */
    isModelLocked: (state) => Boolean(state.activeSession?.readonlyModel),
    /**
     * 현재 화면 하단 입력창 영역에 도식화되어 투영되어야 할 활성 툴바 세팅 정보를 추출 게팅합니다.
     */
    activePromptToolSettings: (state) => {
      const chatId = state.selectedChatId || DRAFT_PROMPT_TOOL_SETTINGS_KEY; // 방이 아직 없다면 초동 임시 가상 키로 바이패스 유도
      return clonePromptToolSettings(
        state.promptToolSettingsMap[chatId] || DEFAULT_PROMPT_TOOL_SETTINGS
      );
    },
  },
  actions: {

    /**
     * 메인 화면 새 대화 첫 질문으로 생성된 방 ID를 일회성 플래그로 기록합니다.
     * ChatContainer가 main -> chat 라우트 전환으로 재생성되어도 Pinia store에 남아 있어
     * 기존 대화방 입장용 hydration overlay와 하단 강제 이동을 정확히 건너뛸 수 있습니다.
     */
    markPendingNewSubmitChat(chatId) {
      const id = String(chatId || "").trim();
      if (!id) return;
      this.pendingNewSubmitChatIds = {
        ...this.pendingNewSubmitChatIds,
        [id]: true,
      };
    },
    /**
     * 새 대화 submit 플래그를 한 번만 소비합니다.
     * true가 반환되는 경우에는 이미 submit 흐름에서 사용자 질문/assistant typing 메시지가
     * messageMap에 들어간 상태이므로 history hydration을 수행하지 않습니다.
     */
    consumePendingNewSubmitChat(chatId) {
      const id = String(chatId || "").trim();
      if (!id || !this.pendingNewSubmitChatIds[id]) return false;
      const next = {...this.pendingNewSubmitChatIds};
      delete next[id];
      this.pendingNewSubmitChatIds = next;
      return true;
    },

    /**
     * 백엔드 세션 조회 API 등으로부터 전달받은 전체 대화 이력 히스토리를 강제 동기화 수립합니다.
     */
    setHistories(histories = []) {
      this.histories = histories;
    },
    /**
     * 고유 식별 Key를 기반으로 타깃 대화 이력 단일 레코드를 안전하게 뒤져내 반환합니다.
     */
    getHistory(id) {
      return (
        this.histories.find((item) => String(item.id) === String(id)) || null
      );
    },
    /**
     * @function setActiveSession
     * @description 유저가 대화방을 체인지하거나 새로운 방에 인입했을 때 글로벌 세션 상태와 포인터 ID를 리타겟팅 스위칭합니다.
     * @param {object|null} session - 새로 개통 전개된 챗방 세션 디테일 오브젝트
     */
    setActiveSession(session = null) {
      this.activeSession = session;
      this.selectedChatId = session?.chatId || null; // 활성 룸 포인터 인덱스 강제 변환 수립
      this.resetActivePromptToolSettings(); // 방이 체인지되었으므로 툴바 세팅 캐시 구조체도 타깃에 맞게 세로정렬 리셋 트리거
    },
    /**
     * 현재 활성화된 방을 폭파 해제하고 공백 상태로 뷰포트를 전면 언마운트 리셋 클리어합니다.
     */
    clearActiveSession() {
      this.activeSession = null;
      this.selectedChatId = null;
      this.resetActivePromptToolSettings();
    },
    /**
     * 특정 대화방 소유의 말풍선 메시지 리스트 데이터 타깃 풀을 업데이트 맵핑 주입합니다.
     */
    setMessages(chatId, messages = []) {
      this.messageMap = {
        ...this.messageMap,
        [chatId]: messages, // 해시 구조 갱신 리액티비티 트리거 유도
      };
    },
    /**
     * 새로운 대화 이력이 생성되었거나 변경 사항이 발생했을 때 리스트 최선두에 아이템을 새치기 배치하고 구방을 뒤로 밀어 정렬합니다.
     */
    addHistory(history) {
      this.histories = [
        history,
        ...this.histories.filter((item) => item.id !== history.id), // 중복 제거 매칭 스크리닝 동시 집행
      ];
    },
    /**
     * 스토어 내부 탐색 게터들이 참조할 적합성 타깃 룸 ID 식별 문자열 키를 리턴합니다.
     */
    getPromptToolSettingsKey() {
      return this.selectedChatId || DRAFT_PROMPT_TOOL_SETTINGS_KEY;
    },
    /**
     * 현재 스코프 활성 영역의 입력창 툴바 옵션을 공장 출고 규격 사양 사양으로 전면 포맷 리셋시킵니다.
     */
    resetActivePromptToolSettings() {
      const chatId = this.getPromptToolSettingsKey();
      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [chatId]: clonePromptToolSettings(DEFAULT_PROMPT_TOOL_SETTINGS), // 불변 객체 딥 카피 주입 완료
      };
    },
    /**
     * @function ensurePromptToolSettings
     * @description 특정 챗방 전용 툴바 옵션 적치 공간이 맵 내부에 부재하여 에러가 나는 현상을 차단하기 위해 고안된 안전 가드 초기화 보장식입니다.
     * @returns {string} 확보가 보장 완료된 대상 챗방의 마스터 조회 키 스트링
     */
    ensurePromptToolSettings() {
      const chatId = this.getPromptToolSettingsKey();
      if (!this.promptToolSettingsMap[chatId]) {
        this.promptToolSettingsMap = {
          ...this.promptToolSettingsMap,
          [chatId]: clonePromptToolSettings(DEFAULT_PROMPT_TOOL_SETTINGS),
        };
      }
      return chatId; // 앵커 키 반환
    },

    /**
     * 유저가 모델 종류를 도중에 스위칭 체인지했을 때, 다른 기종 LLM 프롬프트 토큰과 매핑 구조가 충돌을 방지하기 위해
     * 마운트되어 있던 프롬프트 템플릿 서랍 세팅을 무효화 청소 초기화합니다.
     */
    resetActivePromptTemplate() {
      const chatId = this.ensurePromptToolSettings();
      const current = clonePromptToolSettings(
        this.promptToolSettingsMap[chatId]
      );
      current.promptTemplateId = null; // 템플릿 결합 해제
      current.promptTemplateOptions = {}; // 하위 라디오 세부 설정값 흔적 소거

      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [chatId]: current,
      };
    },
    /**
     * @function setActivePromptTemplate
     * @description 유저가 프롬프트 서랍 툴바에서 특정 목적지 프리셋 카드(번역기 등)를 선택 클릭했을 때 온/오프 세팅을 바인딩 토글 갱신합니다.
     * @param {string} templateId - 타깃 시스템 프롬프트 템플릿의 고유 Key
     */
    setActivePromptTemplate(templateId) {
      const chatId = this.ensurePromptToolSettings();
      const current = clonePromptToolSettings(
        this.promptToolSettingsMap[chatId]
      );
      // 이미 연타 선택된 동일 템플릿 ID 인입 시 해제(Toggle Off)하고, 새로운 사양 구동 시 교체 마운트합니다.
      const nextTemplateId =
        current.promptTemplateId === templateId ? null : templateId;
      current.promptTemplateId = nextTemplateId;
      current.promptTemplateOptions = {}; // 교체 시점에는 하위 세부 옵션값들을 깔끔하게 리셋 포맷 처리

      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [chatId]: current,
      };
    },
    /**
     * @function setPromptTemplateOption
     * @description 프롬프트 템플릿 조립 가이드 패널 내에서 동적 파라미터 변수(말투 톤앤매너 -> 격식체 등)를 매칭 세팅합니다.
     * @param {string} groupId - 대상 하위 옵션 가이드 카테고리 고유 명칭 (예: 'tone')
     * @param {string} optionTag - 유저가 라디오 버튼으로 최종 클릭한 대상 식별 태그명 (예: 'formal')
     */
    setPromptTemplateOption(groupId, optionTag) {
      const chatId = this.ensurePromptToolSettings();
      const current = clonePromptToolSettings(
        this.promptToolSettingsMap[chatId]
      );
      current.promptTemplateOptions = {
        ...current.promptTemplateOptions,
        [groupId]: optionTag, // 특정 그룹 슬롯에 밸류값 저격 수립 매핑
      };

      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [chatId]: current,
      };
    },
    /**
     * @function setPromptToolGroupEnabled
     * @description 대도구 범주(예: 웹 실시간 검색 기능)의 마스터 스위치를 글로벌 파워 온/오프 토글 동기화합니다.
     * @param {string} groupId - 타깃 제어 대상 도구의 세팅 그룹 명칭
     * @param {boolean} enabled - 점등(true) 혹은 강제 비활성화 차단 소등(false) 상태 값
     */
    setPromptToolGroupEnabled(groupId, enabled) {
      const chatId = this.ensurePromptToolSettings();
      const current = clonePromptToolSettings(
        this.promptToolSettingsMap[chatId]
      );

      if (groupId === "webSearch") {
        current.webSearchEnabled = Boolean(enabled); // 마스터 전원 토글
        if (!enabled) {
          current.webSearch = null; // 대도구 자체가 소등 전원 차단되었다면 하위 세부 스펙(엔진 세팅 등)도 숏서킷 클리어 소거합니다.
        }
      }

      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [chatId]: current,
      };
    },
    /**
     * @function togglePromptToolOption
     * @description 하위 세부 칩들(검색 기간 필터, 지식 소스 타깃 범위 칩 등)을 클릭했을 때 단일 선택 / 다중 체크박스 룰에 입각하여 배열을 가공 가도합니다.
     * @param {string} groupId - 타깃 세팅 그룹의 고유 데이터 명칭
     * @param {string} optionId - 유저가 활성화 토글을 지시한 대상 유닛 아이템 코드 ID
     * @param {string} [selectionMode="multiple"] - 'single' (라디오 전용 스위칭) 또는 'multiple' (다중 체크박스 온오프 연산) 규칙 모드 가이드
     */
    togglePromptToolOption(groupId, optionId, selectionMode = "multiple") {
      const chatId = this.ensurePromptToolSettings();
      const current = clonePromptToolSettings(
        this.promptToolSettingsMap[chatId]
      );

      if (selectionMode === "single") {
        // 단일 선택 라디오 룰: 동일 칩 연타 시 null 해제 처리하고, 타 칩 선택 시 기존 값을 덮어써서 단일 밸류 치환합니다.
        current[groupId] = current[groupId] === optionId ? null : optionId;

        // 하위 엔진 설정값이 수립되었다면, 연동성 보정을 위해 상위 마스터 웹 서치 전원 스위치 상태를 완벽하게 연쇄 자동 활성화 켬 처리해 줍니다.
        if (groupId === "webSearch") {
          current.webSearchEnabled = Boolean(current.webSearch);
        }
      } else {
        // 다중 선택 체크박스 룰: 배열에 이미 실재하는 식별자면 필터 제거 스크리닝하고, 신규 인입이면 불변 어레이 구조로 요소를 Push 병합 적치합니다.
        const values = Array.isArray(current[groupId]) ? current[groupId] : [];
        current[groupId] = values.includes(optionId)
          ? values.filter((value) => value !== optionId)
          : [...values, optionId];
      }

      this.promptToolSettingsMap = {
        ...this.promptToolSettingsMap,
        [chatId]: current,
      };
    },
  },
});
