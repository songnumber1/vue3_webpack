/**
 * @file composables/chat/container/useChatUIController.js
 * @description ChatContainer 전용 controller 계층입니다. route, UI 상태, scroll, modal, submit 흐름을 도메인별 composable로 조립합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, ref, watch} from "vue";
import {useEventListener} from "@vueuse/core";
import {useI18n} from "vue-i18n";
import {useRouter} from "vue-router";
import {useAppContext} from "@/composables/app/useAppContext";
import {useAutoScroll} from "@/composables/chat/useAutoScroll";
import {useImagePreview} from "@/composables/chat/useImagePreview";
import {useViewportGuard} from "@/platform/viewport/useViewportGuard";
import {useNavigationStore} from "@/stores/navigationStore";
import {usePlatformStore} from "@/stores/platformStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {useViewportStore} from "@/stores/viewportStore";
import {syncViewportSettings} from "@/utils/applyViewportBreakpoint";
import {useChatHistoryActionDialog} from "@/composables/chat/container/useChatHistoryActionDialog";
import {useChatMobileState} from "@/composables/chat/container/useChatMobileState";
import {useChatNavigationActions} from "@/composables/chat/container/useChatNavigationActions";
import {useChatPromptActions} from "@/composables/chat/container/useChatPromptActions";
import {useChatScrollController} from "@/composables/chat/container/useChatScrollController";
import {useAppShellActions} from "@/composables/app/useAppShellActions";
import {useAppShellOverlays} from "@/composables/app/useAppShellOverlays";

/**
 * @function useChatUIController
 * @description 화면에 노출되는 팝업, 다이얼로그, 스크롤 메커니즘 및 디바이스 인프라 이벤트를 일괄 조율하는 UI 레이어 마스터 컴포저블입니다.
 * @param {Object} context - 외부 데이터 컨트롤러로부터 수임받는 핵심 반응형 소스 팩
 * @param {Ref<Array>} context.messages - 화면에 드로잉 중인 실시간 대화 말풍선 레코드 데이터 배열
 * @param {Object} context.runtime - 비즈니스 코어 비동기 액션 공급자 스토어
 * @param {Object} context.pageState - 현재 진입한 라우터 주소창의 상태 가이드 (isMainPage, isReadOnly 등)
 * @param {Ref<String|null>} context.activeHistoryId - 현재 활성화된 세션방의 고유 식별 키
 */
export function useChatUIController({
  messages,
  runtime,
  pageState,
  activeHistoryId,
}) {
  const {t} = useI18n();
  const router = useRouter();

  // 글로벌 테마(다크/라이트 모드) 변경 허브 콘텍스트를 구독합니다.
  const {theme} = useAppContext();
  const navigationStore = useNavigationStore();
  const platformStore = usePlatformStore();
  const systemSettingsStore = useSystemSettingsStore();
  const viewportStore = useViewportStore();

  // 모바일 중단점(Breakpoint) 설정을 뷰포트 빌더 엔진에 초기 동기화 인젝션합니다.
  syncViewportSettings(systemSettingsStore.mobileBreakpoint);

  // ── [1. 돔 레퍼런스 및 모달/시트 개폐 플래그 셋] ──────────────────
  const {scrollToBottom} = useAutoScroll({value: null});
  const workspaceRef = ref(null); // 스크롤 연산 타깃이 될 메인 워크스페이스 컨테이너 DOM 가리킴 고리
  const themeName = ref(theme.current); // 현재 브라우저에 마운트된 UI 테마 식별 명칭

  // 각종 바텀시트 및 오버레이 설정 레이어 모달들의 마운트 플래그 세트
  const assistantSheetOpen = ref(false); // 모바일 전용 AI 어시스턴트 변경 시트
  const {
    noticeOpen,
    privacyOpen,
    personalizationOpen,
    systemOpen,
    languageSheetOpen,
    mobileSettingsOpen,
    handleMobileSettingsDesktopOpen,
  } = useAppShellOverlays();

  // AI가 문장을 완성해 나갈 때 스크롤을 자동으로 하향 추적할지 여부를 판별하는 사용자 커스텀 옵션값
  const autoScrollOnAnswer = computed(
    () => systemSettingsStore.autoScrollOnAnswer
  );

  // ── [2. 첨부 이미지 미리보기 인터랙션 하위 파이프라인] ──────────────────
  const {
    previewImage,
    closeImagePreview,
    handlePreviewLoad,
    handlePreviewError,
  } = useImagePreview();

  // ── [3. 모바일 레이아웃 및 뷰포트 디텍팅 허브] ──────────────────
  const isCompactScreen = computed(() => viewportStore.isCompact); // 화면 크기가 압축(컴팩트) 모드인지 판별
  const platformInfo = computed(() => platformStore.info || {});

  // 디바이스의 물리 사양과 에이전트 정보를 대조하여 실제 최종 모바일 모드로 렌더링할지 판단하는 연산 유닛
  const {isMobile, updateMobileState} = useChatMobileState({
    isCompactScreen,
    platformInfo,
  });

  // ── [4. 엘리먼트 가상 고속 스크롤 매니저 엔진] ──────────────────
  const {
    showScrollBottom,
    markForceBottom,
    clearForceBottom,
    scrollBottom,
    scrollInitialTarget,
    scrollLatestUserMessage,
    scheduleBottomStateCheck,
    handleMessageContentRendered,
    cleanupScrollController,
  } = useChatScrollController({
    isConversationPage: pageState.isConversationPage,
    workspaceRef,
    scrollToBottom,
    autoScrollEnabled: autoScrollOnAnswer,
  });

  // ── [5. 모바일 소프트 키보드 충돌 방어 가드] ──────────────────
  // 모바일 브라우저에서 인풋 창 포커싱 시 가상 키보드가 팝업되며 전체 뷰포트 높이가 찌그러지는 현상을 방어합니다.
  const {keyboardOpen, refreshViewport} = useViewportGuard({
    onChange: () => {
      // 키보드 개폐 및 단순 포커스 아웃 시점으로 인한 뷰포트 변화는 자동 스크롤을 강제 유발하지 않도록 가드합니다.
      // 전송 행위 시점의 물리 스크롤 점프는 전적으로 useChatSubmit 모듈이 독점 통제하기 때문입니다.
    },
  });

  // 단순 홈 화면이 아니면서, 실제 모바일 키보드가 활성화되었을 때 레이아웃 왜곡 보정 클래스를 부여하기 위한 상태값
  const layoutKeyboardOpen = computed(
    () => !pageState.isMainPage.value && keyboardOpen.value
  );

  // ── [6. 사이드바 대화방 관리 다이얼로그 가드 박스] ──────────────────
  // 대화방 삭제 확정 알림, 타이틀 수정 폼 팝업 등 서랍 내 인터랙션을 총괄 대행 바인딩합니다.
  const {
    historyDialogOpen,
    historyDialogMode,
    historyDialogTarget,
    historyDialogTitle,
    historyDialogMessage,
    historyNoticeOpen,
    historyNoticeMessage,
    closeHistoryDialog,
    confirmHistoryDialog,
    handleHistoryMenuAction,
  } = useChatHistoryActionDialog({
    t,
    router,
    messages,
    activeHistoryId,
    toggleHistoryBookmark: runtime.toggleHistoryBookmark,
    renameHistory: runtime.renameHistory,
    removeHistory: runtime.removeHistory,
    syncHistoriesInBackground: runtime.syncHistoriesInBackground,
  });

  // ── [7. 하단 프롬프트 인풋 창 상태 활성 제어반] ──────────────────
  const {refreshPromptViewport} = useChatPromptActions({
    isReadOnly: pageState.isReadOnly,
    isActiveModelUnavailable: runtime.isActiveModelUnavailable,
    refreshViewport,
  });

  // ── [8. 상하단 글로벌 네비게이션 액션 브릿지 세팅] ──────────────────
  const navigationActions = useChatNavigationActions({
    router,
    theme,
    themeName,
    messages,
    isMobile,
    assistantSheetOpen,
    noticeOpen,
    privacyOpen,
    personalizationOpen,
    systemOpen,
    languageSheetOpen,
    mobileSettingsOpen,
    navigationStore,
    revokeMessageAttachments: runtime.revokeMessageAttachments,
    clearActiveSession: runtime.clearActiveSession,
    selectAssistant: runtime.selectAssistant,
    refreshViewport,
    clearForceBottom,
    scrollBottom,
  });

  const appShellActions = useAppShellActions({
    router,
    theme,
    themeName,
    isMobile,
    navigationStore,
    noticeOpen,
    privacyOpen,
    personalizationOpen,
    systemOpen,
    languageSheetOpen,
    mobileSettingsOpen,
    scrollBottom,
  });

  // ── [9. 반응형 시스템 세팅 변동 동기화 왓처 마운트] ──────────────────
  // 관리자 도구 혹은 유저 설정에서 모바일 판단 중단점(px) 사양을 실시간 커스텀 변경할 시 즉각 시스템 뷰포트를 리프레시합니다.
  watch(
    () => systemSettingsStore.mobileBreakpoint,
    (breakpoint) => {
      syncViewportSettings(breakpoint);
      refreshViewport();
      updateMobileState();
    }
  );

  // ── [10. 브라우저 글로벌 이벤트 리스너 버스 개통] ──────────────────
  function bindUiEvents() {
    // 윈도우 창 크기가 늘어나거나 줄어들 때 모바일/데스크톱 그리드 레이아웃을 전격 실시간 보정합니다.
    useEventListener(window, "resize", updateMobileState, {passive: true});

    // 유저가 스크롤을 직접 위아래로 휠 조작할 때, 최하단에 도달했는지 도중 이탈했는지 앵커 포지션을 판별 갱신합니다.
    useEventListener(window, "scroll", scheduleBottomStateCheck, {
      capture: true,
      passive: true,
    });
  }

  /**
   * @function handleSystemSettingsApplied
   * @description 팝업창 내부에서 시스템 세팅 가치를 전격 최종 변경 적용 완료하였을 때 호출되는 UI 후처리 동기화 함수입니다.
   */
  function handleSystemSettingsApplied() {
    syncViewportSettings(systemSettingsStore.mobileBreakpoint);
    refreshViewport();
    updateMobileState();
    // 세팅 레이어가 닫히며 돔 구조가 원복될 때 스크롤 위치가 흐트러지지 않게 물리 고정 앵커 연산 호출
    scrollBottom({stable: true});
  }

  /**
   * @function cleanupUiController
   * @description [메모리 누수 차단 가드] 컴포넌트가 파괴되거나 사용자가 해당 채팅 뷰 포트 공간을 완전히 떠날 때
   * 스크롤 타이머 해제 및 브라우저 인메모리에 잔존하는 Blob 파일 객체(이미지 미리보기, 업로드 첨부 자원 등)의 주소(URL)를 영구 소멸 해제합니다.
   */
  function cleanupUiController() {
    cleanupScrollController();
    runtime.revokeMessageAttachments(messages.value);
  }

  // 최상위 SFC 단락의 마크업 및 자식 하위 컴포넌트 공급용 마스터 오브젝트 팩 환원
  return {
    t,
    workspaceRef,
    assistantSheetOpen,
    noticeOpen,
    privacyOpen,
    personalizationOpen,
    systemOpen,
    languageSheetOpen,
    mobileSettingsOpen,
    previewImage,
    themeName,
    isMobile,
    layoutKeyboardOpen,
    showScrollBottom,
    autoScrollOnAnswer,
    historyDialogOpen,
    historyDialogMode,
    historyDialogTarget,
    historyDialogTitle,
    historyDialogMessage,
    historyNoticeOpen,
    historyNoticeMessage,
    closeImagePreview,
    handlePreviewLoad,
    handlePreviewError,
    closeHistoryDialog,
    confirmHistoryDialog,
    handleHistoryMenuAction,
    refreshPromptViewport,
    handleMessageContentRendered,
    markForceBottom,
    clearForceBottom,
    scrollBottom,
    scrollInitialTarget,
    scrollLatestUserMessage,
    refreshViewport,
    updateMobileState,
    bindUiEvents,
    handleSystemSettingsApplied,
    handleMobileSettingsDesktopOpen,
    cleanupUiController,
    ...navigationActions, // 네비게이션 액션 분출 팩 전개 주입
    ...appShellActions, // 앱 shell action은 기존 navigation action을 점진적으로 대체합니다.
  };
}
