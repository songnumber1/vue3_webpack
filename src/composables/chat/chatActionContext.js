/**
 * @file composables/chat/chatActionContext.js
 * @description 채팅 도메인 composable입니다. 질문 전송, 메시지 동기화, SSE 결과 반영, scroll/overlay action을 담당합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

/**
 * @constant {String} CHAT_ACTIONS_KEY
 * @description 글로벌 네비게이션, 모달 다이어로그 팝업, 세션 인증 탈거 등 '채팅 앱 전반의 외곽 프레임 제어 액션 집합'을 하위 트리 컴포넌트에 주입(Provide)하고 수신(Inject)하기 위한 고유 고유 식별자 토큰 키입니다.
 */
export const CHAT_ACTIONS_KEY = "CHAT_ACTIONS";

/**
 * @constant {String} WORKSPACE_ACTIONS_KEY
 * @description 프롬프트 질문 전송, 답변 재생성, 마크다운 렌더링 스크롤 동기화 등 '중앙 대화방 워크스페이스 내부의 실시간 물리 조작 핸들러 묶음'을 안전하게 격리 전파하기 위한 고유 식별자 토큰 키입니다.
 */
export const WORKSPACE_ACTIONS_KEY = "WORKSPACE_ACTIONS";

/**
 * @constant {String} CHAT_WORKSPACE_STATE_KEY
 * @description 채팅 화면 렌더링에 필요한 상태를 props 대신 provide/inject로 공유하기 위한 키입니다.
 */
export const CHAT_WORKSPACE_STATE_KEY = "CHAT_WORKSPACE_STATE";

/**
 * @constant {String} PROMPT_STATE_KEY
 * @description 프롬프트 입력 영역의 모델/생성/모바일 상태를 props 대신 provide/inject로 공유하기 위한 키입니다.
 */
export const PROMPT_STATE_KEY = "PROMPT_STATE";

/**
 * @constant {String} PROMPT_TOOLBAR_STATE_KEY
 * @description PromptComposer 내부 툴바/전송 버튼 상태를 하위 툴바 컴포넌트에 props 없이 공유하기 위한 키입니다.
 */
export const PROMPT_TOOLBAR_STATE_KEY = "PROMPT_TOOLBAR_STATE";

/**
 * @constant {String} PROMPT_TEXTAREA_STATE_KEY
 * @description PromptTextarea의 텍스트/placeholder/전송 차단 상태를 props 없이 공유하기 위한 키입니다.
 */
export const PROMPT_TEXTAREA_STATE_KEY = "PROMPT_TEXTAREA_STATE";

export function createEmptyWorkspaceState() {
  return {
    mode: "main",
    readonly: false,
    isMobile: false,
    assistantLabel: "Assistant",
    assistant: null,
    conversationTitle: "",
    themeName: "light",
    suggestions: [],
    isActiveModelDeleted: false,
    isActiveModelUnavailable: false,
    isGenerating: false,
    messages: [],
    showScrollBottom: false,
    autoScrollOnAnswer: false,
    isHistoryRendering: false,
    historyMessagesLoaded: false,
    hasPreviousHistoryMessages: false,
    historyLazyTopThreshold: 96,
    historyLazyChunkSize: 100,
  };
}

export function createEmptyPromptState() {
  return {
    isMobile: false,
    floating: false,
    showHelp: false,
    selectedModel: "",
    models: [],
    disabled: false,
    generating: false,
    modelReadonly: false,
    placeholder: "",
  };
}

export function createEmptyPromptToolbarState() {
  return {
    disabled: false,
    modelReadonly: false,
    modelValue: "",
    currentModel: {id: "", label: ""},
    models: [],
    tools: [],
    selectedTemplateTool: null,
    attachOptions: [],
    modelMenuOpen: false,
    toolMenuOpen: false,
    attachMenuOpen: false,
    isMobileSheet: false,
    canSubmit: false,
    hasPromptText: false,
    isMicEnabled: false,
    isVoiceListening: false,
    hasVoiceStopped: false,
    generating: false,
    isSpeechSupported: true,
    voiceStartLabel: "Start voice input",
    voiceStopLabel: "Stop voice input",
    attachLabel: "Attach",
    sendLabel: "Send",
    modelSelectLabel: "Select model",
    readonlyTitle: "",
  };
}

/**
 * @description [Null Object 패턴] 글로벌 네비게이션 액션 provide 레이어가 아직 Provide되기 전이거나, 독립형 단위 테스트(Vitest/Jest) 런타임 환경에서 예외 크래시를 방지하기 위해 아무 동작도 수행하지 않는 안전 우회용 빈 더미 함수 객체를 빌드합니다.
 * @returns {{
 * openDrawer: () => void,
 * toggleTheme: () => void,
 * openSwagger: () => void,
 * openAssistant: () => void,
 * openGuide: () => void,
 * openTerms: () => void,
 * openPlayground: () => void,
 * logout: () => void
 * }} 런타임 세이프 아웃라인 액션 패키지 스텁
 */
export function createEmptyChatActions() {
  return {
    openDrawer: () => {}, // 모바일 사이드 메뉴 드로어 개통 무동작 스텁
    toggleTheme: () => {}, // 다크/라이트 테마 반전 무동작 스텁
    openSwagger: () => {}, // API 명세서 이동 무동작 스텁
    openAssistant: () => {}, // AI 모델 바텀시트 개통 무동작 스텁
    openGuide: () => {}, // 가이드북 라우팅 무동작 스텁
    openTerms: () => {}, // 이용약관 팝업 무동작 스텁
    openPlayground: () => {}, // 실험실 플레이그라운드 무동작 스텁
    logout: () => {}, // 인증 토큰 소멸 추방 무동작 스텁
    newChat: () => {}, // 새 대화 시작 무동작 스텁
    selectHistory: () => {}, // 대화방 선택 무동작 스텁
    historyMenuAction: () => {}, // 대화방 메뉴 액션 무동작 스텁
    selectAssistant: () => {}, // 어시스턴트 선택 무동작 스텁
  };
}

/**
 * @description [Null Object 패턴] 프롬프트 입력창 및 타임라인 메시지 아이템 등 하부 트리의 말단 요소들이 상위 컨텍스트의 실시간 조작 엔진을 호출할 때, 의존성 주입 누락으로 인한 `undefined` 호출 버스트 오류를 차단하기 위한 무동작 더미 프로토타입 팩토리를 빌드합니다.
 * @returns {{
 * submit: () => void,
 * regenerate: () => void,
 * updateSelectedModel: () => void,
 * handlePromptFocus: () => void,
 * handlePromptResize: () => void,
 * handleMessageContentRendered: () => void,
 * scrollBottom: () => void
 * }} 런타임 세이프 워크스페이스 코어 액션 패키지 스텁
 */
export function createEmptyWorkspaceActions() {
  return {
    submit: () => {}, // 유저 질문 백엔드 서버 디스패치 무동작 스텁
    regenerate: () => {}, // LLM 답변 재요청 트리거 무동작 스텁
    updateSelectedModel: () => {}, // 대화방 인공지능 타깃 모델 체인지 무동작 스텁
    handlePromptFocus: () => {}, // 입력창 초점 활성화 대응 뷰포트 최신화 무동작 스텁
    handlePromptResize: () => {}, // 입력 텍스트 증가에 따른 높이 가변 보정 무동작 스텁
    handleMessageContentRendered: () => {}, // 실시간 마크다운 파싱 완수 시 스크롤 잠금 연동 무동작 스텁
    scrollBottom: () => {}, // 타임라인 최하단 스크롤 강제 하향 무동작 스텁
    handleHistoryRendered: () => {}, // 대화방 초기 렌더 완료 후 표시 전환 무동작 스텁
    loadPreviousHistoryMessages: () => false, // lazy 이력에서 이전 메시지 묶음 로드 무동작 스텁
    openStudioDetail: () => {}, // Studio 상세 팝업 개통 무동작 스텁
  };
}
