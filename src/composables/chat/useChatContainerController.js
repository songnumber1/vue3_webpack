import {computed, onBeforeUnmount, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {useChatRuntime} from "@/composables/chat/useChatRuntime";
import {useChatDataController} from "@/composables/chat/container/useChatDataController";
import {useChatUIController} from "@/composables/chat/container/useChatUIController";

/**
 * @function useChatContainerController
 * @description 채팅 메인 화면의 상위 비즈니스 로직, UI 인터랙션 및 상태 제어 모델을 하나로 통합하여 조율하는 마스터 컨트롤러 훅입니다.
 * 내부적으로 데이터 전용 컨트롤러(`data`)와 UI 전용 컨트롤러(`ui`)를 생성하고 생명주기를 동기화합니다.
 * @param {Object} props - 상위 부모 뷰 컴포넌트로부터 전달받은 반응형 Props 객체
 * @param {string} props.mode - 현재 페이지의 진입 유형 모드 (`"main"`, `"chat"`, `"shared"`)
 * @returns {Object} 템플릿(UI View)에서 다이렉트로 바인딩하여 사용할 수 있도록 완전히 가공된 상태 플래그 및 메서드 모음집
 * @see {@link useChatRuntime} 채팅 코어 엔진 런타임 제어 훅
 * @see {@link useChatDataController} API 호출 및 메시지 데이터 동기화를 전담하는 데이터 제어 컨트롤러 훅
 * @see {@link useChatUIController} 스크롤, 다이얼로그 모달, 서랍 메뉴 등 레이아웃 인터랙션을 전담하는 UI 제어 컨트롤러 훅
 */
export function useChatContainerController(props) {
  // 1. 현재 주소창의 파라미터(id, shareId 등)를 읽어오기 위해 Vue Router 라우트 객체를 인스턴스화합니다.
  const route = useRoute();

  // 2. 글로벌 채팅 엔진의 상태 및 다국어 인스턴스에 접근하기 위해 공통 런타임 객체를 로드합니다.
  const runtime = useChatRuntime();

  // 3. 화면에 실시간으로 표시될 반응형 대화 메시지 목록 배열 데이터를 생성합니다.
  const messages = ref([]);

  // 4. 컴포넌트가 주입받은 props 내의 실행 모드 속성(mode)을 추적하기 위해 계산된 속성(computed)으로 감쌉니다.
  const currentMode = computed(() => props.mode);

  // 5. 현재 사용자가 보고 있는 화면의 상태 유형을 세분화하여 다양한 Boolean 플래그 셋으로 관리하는 컨텍스트 객체입니다.
  const pageState = {
    currentMode,
    // 대화 이력이 없는 완전히 깨끗한 첫 메인 홈 화면인지 판단합니다.
    isMainPage: computed(() => currentMode.value === "main"),
    // 기존에 진행 중이던 특정 대화방 화면 내부인지 판단합니다.
    isChatPage: computed(() => currentMode.value === "chat"),
    // 타인이 보낸 링크를 타고 들어온 공유된 대화 페이지 화면인지 판단합니다.
    isSharedPage: computed(() => currentMode.value === "shared"),
    // 메인 홈 화면을 제외한, 모든 형태의 '실질적 대화 컨텍스트가 존재하는 화면'인지 통합 판단합니다.
    isConversationPage: computed(() => currentMode.value !== "main"),
    // 공유 페이지와 같이 사용자가 추가적인 대화 전송을 할 수 없는 읽기 전용 상태 화면인지 판단합니다.
    isReadOnly: computed(() => currentMode.value === "shared"),
  };

  /**
   * 진입 유형(모드)에 따라 현재 활성화된 대화방의 고유 ID 식별자를 동적으로 추적합니다.
   * @type {import("vue").ComputedRef<string|null>}
   */
  const activeHistoryId = computed(() => {
    // 현재 진행형 대화방 모드라면 URL 파라미터 경로의 :id 값을 반환합니다.
    if (pageState.isChatPage.value) return route.params.id;
    // 단순 공유 페이지 뷰어 모드라면 URL 파라미터 경로의 :shareId 값을 반환합니다.
    if (pageState.isSharedPage.value) return route.params.shareId;
    // 어떤 조건도 맞지 않는 메인 홈이라면 활성화된 이력 ID가 없으므로 null을 반환합니다.
    return null;
  });

  // 6. 스크롤, 레이아웃 바인딩, 모달 상태 등 순수 UI 인터랙션 로직이 담긴 전용 컨트롤러 인스턴스를 빌드합니다.
  const ui = useChatUIController({
    messages, // 실시간 렌더링에 참조할 메시지 반응형 참조 배열 전달
    runtime, // 다국어 번역 및 공통 데이터 획득용 런타임 인스턴스 주입
    pageState, // 현재 화면의 상태 정보 플래그 셋 공유
    activeHistoryId, // 감지된 활성화 이력 ID 주입
  });

  // 7. API 송수신, 백엔드 동기화, 어시스턴트 모델 정보 제어 등 순수 데이터 파이프라인 로직이 담긴 전용 컨트롤러 인스턴스를 빌드합니다.
  const data = useChatDataController({props, ui, runtime, messages});

  // 8. 데이터 레이어 상 메인 페이지 여부가 변경될 때마다 모바일 전용 UI 상태(예: 모바일 전용 레프트 드로어 닫기 등)를 연동 동기화합니다.
  watch(data.isMainPage, ui.updateMobileState);

  // 9. 현재 화면이 대화방 컨텍스트 상태인지 여부가 바뀔 때도 모바일 타깃 레이아웃 상태를 실시간 보정 업데이트합니다.
  watch(() => data.isConversationPage.value, ui.updateMobileState);

  // 10. UI 컨트롤러 내부에 정의된 각종 윈도우 스크롤 감지 리스너 및 뷰포트 바인딩 이벤트를 전역 가동합니다.
  ui.bindUiEvents();

  // 11. 데이터 컨트롤러 내부에 정의된 전역 SSE 스트리밍 수신 대기 및 에러 리스너 인터페이스를 결합합니다.
  data.bindDataEvents();

  // 12. 현재 진입 조건(activeHistoryId 등)에 따라 기존 대화 이력을 가져오거나 기본 어시스턴트 목록을 로드하는 초기화 작업을 기동합니다.
  data.initializeDataController();

  // 13. 컴포넌트가 소멸(언마운트)되기 직전에 자원 낭비 및 메모리 누수를 막기 위해 UI 가동 리스너들을 정리(Cleanup)합니다.
  onBeforeUnmount(() => {
    ui.cleanupUiController();
  });

  // 14. 하위 자식 컴포넌트나 부모 뷰(Template)에서 복잡한 구조 분해 없이 단 한 번의 호출로 모든 자원을 쓸 수 있도록 파사드(Facade) 규격 객체로 묶어 반환합니다.
  return {
    // ==========================================
    // 🌍 [공통 & 시스템 전역 관련 정보]
    // ==========================================
    t: ui.t, // 다국어 i18n 번역 처리 함수
    runtimeReady: data.runtimeReady, // 초기 필수 메타 API 로딩이 완료되었는지 여부
    workspaceRef: ui.workspaceRef, // 대화 워크스페이스 DOM 노드 접근용 Vue Ref 객체

    // ==========================================
    // [AI 모델 & 어시스턴트 데이터 관련 정보]
    // ==========================================
    assistants: data.assistants, // 시스템에서 선택 가능한 AI 어시스턴트 전체 목록
    currentAssistant: data.currentAssistant, // 현재 활성화되어 선택된 타깃 어시스턴트 객체
    models: data.models, // 현재 어시스턴트에서 사용할 수 있는 LLM 거대언어모델 라인업 목록
    selectedAssistantId: data.selectedAssistantId, // 활성화된 어시스턴트 고유 ID 값
    selectedModel: data.selectedModel, // 현재 사용자가 선택한 LLM 모델명 상숫값
    isModelLocked: data.isModelLocked, // 어시스턴트 정책에 따라 모델 강제 고정(변경 불가) 상태 여부
    isActiveModelUnavailable: data.isActiveModelUnavailable, // 임시 점검 등으로 선택된 모델의 사용이 불가능한 상태인지 여부
    messages: data.messages, // 화면 템플릿에 `v-for`로 출력될 정제된 메시지 데이터 본체
    suggestions: data.suggestions, // 메인 페이지 화면에 추천 제안용으로 띄워줄 가이드 프롬프트 셋
    isGenerating: data.isGenerating, // AI가 답변을 실시간 스트리밍(생성) 중인 상태인지 나타내는 플래그
    isReadOnly: data.isReadOnly, // 현재 화면이 대화 입력 작성이 차단된 읽기 전용 상태인지 여부
    activeConversationTitle: data.activeConversationTitle, // 상단 헤더에 표기될 현재 대화방의 고유 제목 명칭 문자열
    workspaceAssistantLabel: data.workspaceAssistantLabel, // 대화창 중앙 혹은 플레이스홀더에 기재될 타깃 어시스턴트 표기 레이블

    // ==========================================
    // [bottom sheet 메뉴 / 모달 다이얼로그 개폐(Open) 상태 관련 정보]
    // ==========================================
    showScrollBottom: ui.showScrollBottom, // 하단 강제 스크롤 유도 플로팅 버튼 노출 여부 플래그
    assistantSheetOpen: ui.assistantSheetOpen, // 모바일 환경 하단 어시스턴트 변경 시트창 활성화 여부
    noticeOpen: ui.noticeOpen, // 공지사항 모달 팝업 오픈 상태
    privacyOpen: ui.privacyOpen, // 개인정보 처리방침 안내 모달 오픈 상태
    personalizationOpen: ui.personalizationOpen, // 맞춤형 대화 설정(개인화 지침) 모달 오픈 상태
    systemOpen: ui.systemOpen, // 관리자/시스템 세부 대화 설정 설정 모달 오픈 상태
    languageSheetOpen: ui.languageSheetOpen, // 다국어 언어 변경 바텀 시트창 활성화 여부
    mobileSettingsOpen: ui.mobileSettingsOpen, // 모바일 환경 전용 간이 세팅 메뉴 활성화 여부
    historyNoticeOpen: ui.historyNoticeOpen, // 대화 히스토리 관련 안내 알림 상자 활성화 여부
    historyNoticeMessage: ui.historyNoticeMessage, // 대화 히스토리 알림 상자 본문 내용

    // ==========================================
    // [히스토리 삭제/수정 공통 Confirm 알림창 상태 제어 정보]
    // ==========================================
    historyDialogOpen: ui.historyDialogOpen, // 히스토리 제어 전용 확인 모달(Confirm) 개폐 여부
    historyDialogMode: ui.historyDialogMode, // 확인창 목적 분기 모드 (`"delete"`, `"clear"`, `"rename"` 등)
    historyDialogTarget: ui.historyDialogTarget, // 확인창 제어 타깃이 되는 특정 대화방 이력의 고유 식별 컨텍스트
    historyDialogTitle: ui.historyDialogTitle, // 확인창 모달 타이틀 제목
    historyDialogMessage: ui.historyDialogMessage, // 확인창 모달 상세 메시지 본문

    // ==========================================
    // [컴포넌트 테마 및 레이아웃 상태 관련 정보]
    // ==========================================
    previewImage: ui.previewImage, // 현재 큰 창 이미지 미리보기 모달에 올라가 있는 이미지 주소/객체
    themeName: ui.themeName, // 현재 활성화된 스타일 테마 코드명 (`"light"`, `"dark"`)
    isMobile: ui.isMobile, // 현재 해상도가 모바일 기준 뷰포트에 부합하는지 여부
    layoutKeyboardOpen: ui.layoutKeyboardOpen, // 모바일 소프트 키보드가 올라와 뷰포트 높이가 줄었는지 판단 플래그
    autoScrollOnAnswer: ui.autoScrollOnAnswer, // 데이터 생성 시 화면을 아래로 지속 자동 스크롤 시킬지 여부 옵션 변수

    // ==========================================
    // [유저 인터랙션 UI 이벤트 및 창 제어 액션 메서드 모음]
    // ==========================================
    closeImagePreview: ui.closeImagePreview, // 이미지 미리보기 모달 레이어를 닫는 함수
    handlePreviewLoad: ui.handlePreviewLoad, // 미리보기 이미지 렌더링 로드 완료 이벤트 핸들러
    handlePreviewError: ui.handlePreviewError, // 미리보기 이미지 로드 실패 시 예외 처리 핸들러
    startNewChatWithAssistant: ui.startNewChatWithAssistant, // 특정 어시스턴트를 지정하며 새로운 대화 컨텍스트를 새로 여는 함수
    startNewChat: ui.startNewChat, // 현재 어시스턴트 상태를 유지한 채 완전 초기 빈 대화방으로 나가는 함수
    openHistory: ui.openHistory, // 사이드바 목록 등에서 특정 대화방 이력을 클릭해 과거 메시지를 불러오는 함수
    handleHistoryMenuAction: ui.handleHistoryMenuAction, // 대화 이력 우측 삼점 메뉴 아이콘 클릭 시 행동 분기 제어 함수
    closeHistoryDialog: ui.closeHistoryDialog, // 히스토리 제어용 공통 확인 모달창을 취소하여 닫는 함수
    confirmHistoryDialog: ui.confirmHistoryDialog, // 히스토리 제어용 공통 확인 모달창의 최종 행위를 승인(Confirm)하는 함수
    openMobileDrawer: ui.openMobileDrawer, // 모바일 환경에서 좌측 히스토리 목록 서랍 메뉴를 당겨서 여는 함수
    toggleTheme: ui.toggleTheme, // 라이트모드 ↔ 다크모드 스타일 스타일을 토글 전환하는 함수
    openSwagger: ui.openSwagger, // 개발 도구 API 명세서(Swagger) 새 창 링크 오픈 함수
    openPlayground: ui.openPlayground, // AI 실험실(Playground) 서브 시스템 전환 함수
    openSettings: ui.openSettings, // 시스템 기본 환경 설정 레이어를 호출하는 함수
    openGuide: ui.openGuide, // 사용자 가이드 및 튜토리얼 레이어를 여는 함수
    openNotice: ui.openNotice, // 시스템 공지사항 모달창을 오픈하는 함수
    openPrivacy: ui.openPrivacy, // 개인정보 처리방침 전체 문서 모달창을 오픈하는 함수
    openTerms: ui.openTerms, // 이용약관 명세 뷰어 레이어를 호출하는 함수
    openPersonalization: ui.openPersonalization, // 맞춤형 명령어 설정(개인화) 제어창을 여는 함수
    openSystem: ui.openSystem, // 시스템 하이퍼파라미터 고급 조정 창을 호출하는 함수
    openLanguage: ui.openLanguage, // 언어 번역 설정 바텀 시트를 호출하는 함수
    openAssistantFromHeader: ui.openAssistantFromHeader, // 상단 헤더 타이틀 영역 클릭을 통한 모바일 어시스턴트 선택창 호출 함수
    logout: ui.logout, // 현재 유저의 세션을 만료하고 로그아웃을 처리하는 함수
    handlePromptFocus: ui.handlePromptFocus, // 프롬프트 입력창 포커스 이벤트 발생 시 키보드 상태 감지 연동 핸들러
    handlePromptResize: ui.handlePromptResize, // 입력 문자 길이에 따른 입력란 높이 동적 가변 조절 핸들러
    handleMessageContentRendered: ui.handleMessageContentRendered, // 마크다운 컴포넌트 렌더링 완료에 따른 자동 스크롤 추적 핸들러
    scrollBottom: ui.scrollBottom, // 최하단 위치로 뷰포트를 수동 강제 자동 스크롤 시키는 함수
    handleSystemSettingsApplied: ui.handleSystemSettingsApplied, // 시스템 세팅 변경 사양이 완료되었을 때 호출하는 피드백 리스너

    // ==========================================
    // [실질적 프롬프트 전송 & AI 생성 트리거 액션 메서드]
    // ==========================================
    submitIfWritable: data.submitIfWritable, // 쓰기 가능 모드일 때 사용자의 프롬프트 메시지를 최종 서버에 전송하는 함수
    regenerateIfWritable: data.regenerateIfWritable, // 쓰기 가능 모드일 때 특정 대화 답변 지점부터 다시 문장을 재생성하도록 지시하는 함수
  };
}
