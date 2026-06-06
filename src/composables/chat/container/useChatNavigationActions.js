/**
 * @file composables/chat/container/useChatNavigationActions.js
 * @description ChatContainer 전용 controller 계층입니다. route, UI 상태, scroll, modal, submit 흐름을 도메인별 composable로 조립합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {nextTick} from "vue";
import {isNavigationFailure} from "vue-router";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {logWarn} from "@/utils/logger";
import {authApiLive} from "@/api/live/authApi.live";
import {useAuthStore} from "@/stores/authStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useChatStore} from "@/stores/chatStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {navigateToConversation} from "@/composables/chat/navigation/conversationUrlPolicy";
import {getRuntimeSystemSettings} from "@/utils/systemSettingsRuntime";
import {isMermaidRenderingEnabledForPlatform} from "@/utils/mermaidPlatformSettings";

/**
 * @typedef {object} ChatNavigationActionsDependencies
 * @property {object} router - 뷰 라우터(Vue Router) 인스턴스
 * @property {object} theme - 글로벌 다크/라이트 테마 제어 인터페이스 객체
 * @property {import('vue').Ref<string>} themeName - 현재 브라우저에 활성화된 전역 테마 스트링 명칭 상태값
 * @property {import('vue').Ref<Array>} messages - 현재 화면 타임라인에 렌더링 중인 실시간 대화 메시지 배열 모델
 * @property {import('vue').Ref<boolean>} isMobile - 모바일 해상도 및 모바일 플랫폼 작동 여부 통합 식별 플래그
 * @property {import('vue').Ref<boolean>} assistantSheetOpen - 어시스턴트 선택 바텀시트 활성화 여부 제어 플래그
 * @property {import('vue').Ref<boolean>} noticeOpen - 공지사항 팝업 모달 노출 여부 제어 플래그
 * @property {import('vue').Ref<boolean>} privacyOpen - 개인정보 처리방침 팝업 모달 노출 여부 제어 플래그
 * @property {import('vue').Ref<boolean>} personalizationOpen - 개인화/맞춤 설정 모달 노출 여부 제어 플래그
 * @property {import('vue').Ref<boolean>} systemOpen - 시스템 운영 어드민 설정 모달 노출 여부 제어 플래그
 * @property {import('vue').Ref<boolean>} languageSheetOpen - 다국어 설정 바텀시트 노출 여부 제어 플래그
 * @property {import('vue').Ref<boolean>} mobileSettingsOpen - 모바일 전용 환경설정 전체 패널 노출 여부 제어 플래그
 * @property {object} navigationStore - 네비게이션 드로어 및 모달 토글 통합 상태 전역 스토어
 * @property {function(Array): void} revokeMessageAttachments - 업로드 대기/완료된 기존 첨부파일의 임시 Blob URL 리소스를 해제하여 메모리 누수를 막는 유틸
 * @property {function(): void} clearActiveSession - 현재 진행 중이던 로컬 세션의 채팅방 ID 포인터를 클리어하는 초기화 함수
 * @property {function(string, object=): Promise<void>} selectAssistant - 특정 AI 어시스턴트 모델을 전격 스위칭 셋업하는 비동기 함수
 * @property {function(): void} refreshViewport - 모바일 브라우저 주소창 요동에 맞춰 뷰포트 높이(px)를 강제 보정 계산하는 유틸
 * @property {function(): void} clearForceBottom - 사용자의 강제 하단 고정 잠금 플래그를 탈거 해제하는 함수
 * @property {function(object=): void} scrollBottom - 채팅창 타임라인 스크롤을 하단 최하단으로 부드럽게 밀어내리는 조작 함수
 */

/**
 * @description 채팅 웹 어플리케이션 전반의 좌측 드로어 네비게이션 메뉴 및 상단 헤더 영역에서 유발되는 각종 이동, 모달 오픈, 테마 전환, 로그아웃 액션을 일원화 통제하는 중앙 지휘 허브 훅입니다.
 * @param {ChatNavigationActionsDependencies} dependencies - 다른 도메인과 뷰 내부 라이프사이클에서 위임 전달받은 종속 인터페이스 세트
 * @returns {object} 메뉴 버튼들과 1:1 다이렉트 핸들러 매핑 처리를 위한 실행 함수 패키지
 */
export function useChatNavigationActions({
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
  revokeMessageAttachments,
  clearActiveSession,
  selectAssistant,
  refreshViewport,
  clearForceBottom,
  scrollBottom,
}) {
  // AI 답변 타이핑 도중 부가 기능 조작 난입을 통제하기 위해 실시간 스트리밍 스토어 마운트
  const chatStreamStore = useChatStreamStore();
  const chatStore = useChatStore();
  const systemSettingsStore = useSystemSettingsStore();

  /**
   * @description 답변 스트리밍 또는 대화방 이력 렌더링 중에는 좌측 메뉴/헤더 이동을 차단합니다.
   * ProgressBar가 설정으로 숨겨져 있어도 pendingSelectedChatId는 유지되므로,
   * 대용량 대화방 메시지가 실제 화면에 출력될 때까지 답변 생성 중과 동일하게 메뉴 이동을 막습니다.
   * @returns {boolean} 네비게이션 액션 차단 여부
   */
  function isNavigationLocked() {
    return chatStreamStore.isStreaming || chatStore.isNavigationLocked;
  }

  /**
   * @description 새 대화/Assistant 선택은 기존 대화방 이력 렌더링 상태에서 빠져나가는
   * 명시적 초기화 액션이므로 history navigation lock을 먼저 해제합니다.
   * 스트리밍 중 이동 차단 정책은 그대로 유지합니다.
   */
  function releaseChatNavigationStateForMain() {
    chatStore.clearPendingSelectedChatId();
    chatStore.setHistoryNavigationLocked(false);
    chatStreamStore.clearAllowedNavigation();
  }

  function isMainRouteActive() {
    const current = router.currentRoute?.value || {};
    return current.name === ROUTE_NAMES.MAIN && current.path === "/";
  }

  async function moveToMainRoute() {
    releaseChatNavigationStateForMain();

    const firstResult = await router.replace({name: ROUTE_NAMES.MAIN});

    if (isMainRouteActive()) return;

    if (isNavigationFailure(firstResult)) {
      releaseChatNavigationStateForMain();
    }

    const secondResult = await router.replace("/");
    if (isMainRouteActive()) return;

    if (isNavigationFailure(secondResult)) {
      releaseChatNavigationStateForMain();
      await router.push({name: ROUTE_NAMES.MAIN}).catch(() => {});
    }
  }

  /**
   * @description [내부 공통 로직] 대화 타임라인을 파괴 비우고 메모리 누수를 막기 위해 파일 리소스를 취소 처리한 뒤 초기 메인 대시보드로 라우팅 이탈합니다.
   * @param {object} [options={}] - 신규 대화 초기화 커스텀 옵션 패킷
   * @param {string|null} [options.assistantId=null] - 새로운 채팅방 개통과 동시에 특정 어시스턴트를 자동 낙점 선택하고자 할 때 주입하는 ID 포인터
   */
  async function resetChatState({assistantId = null} = {}) {
    if (chatStreamStore.isStreaming) return; // 답변 스트리밍 중 이동 차단 정책은 유지

    releaseChatNavigationStateForMain();

    // 메모리 누수 방지 가드: 대화방을 완전히 나가거나 초기화하므로 가비지 컬렉터 유도를 위해 첨부파일 인메모리 임시 URL 전원 소멸 폐기
    revokeMessageAttachments(messages.value);
    messages.value = []; // 대화창 배열 원자적 증발

    // URL 숨김/노출 모드 모두에서 새 대화 진입 전 활성 방 포인터와
    // 대화방 전용 Pinia 상태를 먼저 초기화해야 /chat 상태가 남지 않습니다.
    clearActiveSession();

    if (assistantId) {
      try {
        // 어시스턴트를 교체 지정하며 진입하는 국면인 경우 서비스단에 타깃 인자를 전달하여 신규 대화 모드 점화
        await selectAssistant(assistantId, {forNewChat: true});
      } catch (error) {
        logWarn("[useChatNavigationActions] selectAssistant 오류:", error);
      }
      assistantSheetOpen.value = false; // 연동 바텀시트 가인드 폐쇄
    }

    navigationStore.closeTransientPanels(); // 화면에 열려 있던 임시 우측 사이드 패널 등 일괄 수거 클로즈
    navigationStore.setDrawerOpen(false); // PC/모바일 모두 좌측 드로어 잔상 없이 메인 화면으로 복귀
    navigationStore.setCollapsedRecentOpen(false);
    clearForceBottom(); // 하단 스크롤 강제 락 전격 오프

    // Vue Router 4는 guard 취소를 reject하지 않고 navigation failure로 resolve할 수 있습니다.
    // 결과를 확인하며 메인 라우트가 실제로 확정될 때까지 최소 재시도합니다.
    await moveToMainRoute().catch((error) => {
      logWarn("[useChatNavigationActions] main route 이동 오류:", error);
    });
  }

  // 외부 노출 인터페이스 명칭을 도메인에 직관적인 'startNewChat' 별칭 명세로 동기 미러 바인딩 처리
  const startNewChat = resetChatState;

  /**
   * @description 사용자가 히스토리 사이드바에서 과거 특정 대화 내역 항목을 클릭했을 때 해당 채팅방 고유 주소 파라미터(UUID)를 셋업하여 방을 이동합니다.
   * @param {object} item - 라우팅 타깃이 된 특정 대화방 히스토리 로우 오브젝트
   */
  async function openHistory(item) {
    if (isNavigationLocked()) return false;
    const historyId = String(item?.id || "").trim();
    if (!historyId) return false;

    const currentRoute = router.currentRoute?.value || {};
    const currentRouteChatId =
      currentRoute.name === ROUTE_NAMES.CHAT_DETAIL
        ? String(currentRoute.params?.id || "").trim()
        : "";
    const currentActiveChatId =
      chatStore.activeRoomType === "chat"
        ? String(chatStore.activeRoomId || "").trim()
        : "";
    const currentSelectedChatId = String(chatStore.selectedChatId || "").trim();
    const isSameChatRoom =
      historyId === currentActiveChatId ||
      historyId === currentSelectedChatId ||
      historyId === currentRouteChatId;

    // 이미 열린 동일 채팅방을 다시 클릭한 경우에는 라우터 이동과 hydration을 재시작하지 않습니다.
    // 동일 URL 이동은 route watcher를 다시 발생시키지 않으므로 pending lock만 남을 수 있습니다.
    if (isSameChatRoom) {
      chatStore.clearPendingSelectedChatId();
      chatStore.setHistoryNavigationLocked(false);
      navigationStore.closeTransientPanels();
      navigationStore.setDrawerOpen(false);
      navigationStore.setCollapsedRecentOpen(false);
      return true;
    }

    chatStore.setPendingSelectedChatId(historyId);
    navigationStore.closeTransientPanels(); // 대화 맥락이 바뀌므로 열려 있던 우측 정보 패널들 강제 셧다운
    // 모바일/좁은 화면에서는 대용량 대화방 historyRender overlay가 시작되기 전에
    // 좌측 드로어와 접힌 최근 목록을 먼저 닫아 로딩 화면과 메뉴가 겹쳐 보이지 않게 합니다.
    navigationStore.setDrawerOpen(false);
    navigationStore.setCollapsedRecentOpen(false);
    await navigateToConversation({
      router,
      chatStore,
      settings: systemSettingsStore.settings,
      chatId: historyId,
      replace: true,
    }).catch(() => {});
    return true;
  }

  /**
   * @description 라이트 모드 <-> 다크 모드 스타일 레이어를 반전 토글하고, 이에 대응하여 메시지 리스트에 내장된 Mermaid.js 기반 순서도/다이어그램 그래프의 색상 스키마를 강제 리렌더링 보정합니다.
   */
  async function toggleTheme() {
    if (isNavigationLocked()) return;
    try {
      theme.toggle(); // 글로벌 하드웨어 테마 쿠키/로컬스토리지 스위칭 연동
      themeName.value = theme.current; // 현재 모드 런타임 캐싱 업데이트

      await nextTick(); // Vue DOM 트리 상에 다크/라이트 CSS 클래스명이 전격 주입 정착되는 프레임 대기

      // [중요 인프라 가드]: 테마 백그라운드가 바뀌면 흰색/검은색 선이 가려지므로 돔 요소를 수색하여 인라인 SVG 머메이드 다이어그램 코드를 강제 강도 압착 재생성
      if (
        isMermaidRenderingEnabledForPlatform(
          getRuntimeSystemSettings(),
          Boolean(isMobile?.value)
        )
      ) {
        await renderMermaidInElement(document.querySelector(".message-list"), {
          force: true,
        });
      }

      // 차트 재생성으로 인해 채팅창 총 길이가 변동될 수 있으므로 스테이블 모드로 하단 최적화 스크롤 복구 안착
      scrollBottom({stable: true});
    } catch (error) {
      logWarn("[useChatNavigationActions] toggleTheme 오류:", error);
    }
  }

  // 시스템 API 개발서 전용 주소창 다이렉트 점프
  function openSwagger() {
    if (isNavigationLocked()) return;
    router.push("/swagger").catch(() => {});
  }

  // 프롬프트 및 API 테스트 전용 실험실(Playground) 화면 이동 (이동 시 사이드 드로어는 눈을 가리기 위해 닫기 처리)
  function openPlayground() {
    if (isNavigationLocked()) return;
    navigationStore.setDrawerOpen(false);
    router.push({name: "playground"}).catch(() => {});
  }

  // 모바일 환경에서 가상 키보드 튐이나 인풋 포커스 록을 깨부수고 부드럽게 좌측 사이드 메뉴 드로어를 슬라이딩 노출합니다.
  function openMobileDrawer() {
    if (isNavigationLocked()) return;

    // 모바일 포커싱 디포커스 처리: 인풋 폼에 포커스가 잡힌 상태에서 드로어가 열리면 UI 레이아웃이 찢어지므로 네이티브 활성 노드 엘리먼트를 강제 블러 처리 탈거
    const activeElement =
      typeof document !== "undefined" ? document.activeElement : null;
    if (activeElement?.blur) activeElement.blur();

    navigationStore.setDrawerOpen(true); // 전역 스토어의 드로어 노출 상태 토글 개통

    // 모바일 안드로이드/웹뷰 해상도 전환 레이턴시를 고려하여 50ms 및 180ms의 시간 시차 차이를 두고 뷰포트 높이 2중 더블 보정 연산 집행
    window.setTimeout(refreshViewport, 50);
    window.setTimeout(refreshViewport, 180);
  }

  // 해상도 조건에 의거하여 반응형으로 디바이스 맞춤형 환경설정 모달 또는 전용 페이지 창을 점등 제어합니다.
  function openSettings() {
    if (isNavigationLocked()) return;
    if (isMobile.value) {
      navigationStore.setDrawerOpen(false); // 모바일은 드로어를 등 뒤로 끄고 전체화면 세팅 팝업 로드
      mobileSettingsOpen.value = true;
      return;
    }
    openPersonalization(); // 데스크톱은 개인화 관리 중앙 데시보드 모달 매핑 실행
  }

  // 이용 가이드라인 가이드북 라우팅 화면 점프
  function openGuide() {
    if (isNavigationLocked()) return;
    navigationStore.setDrawerOpen(false);
    router.push({name: "guide"}).catch(() => {});
  }

  // 시스템 전체 공지사항 모달 가시 노출 활성화
  function openNotice() {
    if (isNavigationLocked()) return;
    navigationStore.setDrawerOpen(false);
    noticeOpen.value = true;
  }

  // 서비스 개인정보 처리방침 규약 모달 가시 노출 활성화
  function openPrivacy() {
    if (isNavigationLocked()) return;
    navigationStore.setDrawerOpen(false);
    privacyOpen.value = true;
  }

  // 서비스 공식 이용약관 서면 페이지 라우팅 이동
  function openTerms() {
    if (isNavigationLocked()) return;
    navigationStore.setDrawerOpen(false);
    router.push({name: "terms"}).catch(() => {});
  }

  // 시스템 커스텀 마이페이지 개인화 모달 팝업 개통
  function openPersonalization() {
    if (isNavigationLocked()) return;
    navigationStore.setDrawerOpen(false);
    personalizationOpen.value = true;
  }

  // 인프라 운영 모니터링 및 코어 시스템 정보 가이드 모달 개통
  function openSystem() {
    if (isNavigationLocked()) return;
    navigationStore.setDrawerOpen(false);
    systemOpen.value = true;
  }

  // 다국어 글로벌 번역 체인지 전용 바텀시트 활성화
  function openLanguage() {
    if (isNavigationLocked()) return;
    languageSheetOpen.value = true;
  }

  /**
   * @description 백엔드 라이브 인증 세션 서버에 로그아웃 HTTP 요청을 무효화 집행하고, 통신 성공 여부와 상관없이 클라이언트 전역 인증 토큰/프로필 컨텍스트 스토어를 영구 리셋 포맷한 뒤 로그인 필수 화면으로 추방 라우트 전환합니다.
   */
  async function logout() {
    if (isNavigationLocked()) return;
    try {
      await authApiLive.logout(); // 1. 인증 가동 서버의 쿠키 및 단방향 세션 블록 날리기 요청
    } catch (error) {
      logWarn("[useChatNavigationActions] logout 오류:", error); // 서버 다운 등으로 실패하더라도 프론트엔드 탈거는 계속 마감 진행
    } finally {
      useAuthStore().resetAuth(); // 2. 피나(Pinia) 토큰, 유저 프로필 메모리 정보 전격 소멸
      navigationStore.setDrawerOpen(false); // 3. 잔존해 있던 네비게이션 가시 오버레이 파괴 해제

      // 4. 인증 상실 전용 가이드 뷰페이지로 리플레이스 강제 릴리즈 (뒤로가기 방어 처리 및 다국어 리즌 코드 쿼리 수치화 결합)
      await router
        .replace({name: "login-required", query: {reason: "LOGIN_REQUIRED"}})
        .catch(() => {});
    }
  }

  // 상단 탑 헤더 영역의 모델명 버튼 명세 등을 클릭했을 때 하향식 어시스턴트 목록 변경 팝업 시트를 개통 조율
  function openAssistantFromHeader() {
    if (isNavigationLocked()) return;
    assistantSheetOpen.value = true;
  }

  // 최상위 ChatContainer 및 전역 헤더/네비게이션 컴포넌트 뷰 단바인딩용 파이프라인 인터페이스 일괄 표출 반환
  return {
    startNewChat,
    openHistory,
    toggleTheme,
    openSwagger,
    openPlayground,
    openMobileDrawer,
    openSettings,
    openGuide,
    openNotice,
    openPrivacy,
    openTerms,
    openPersonalization,
    openSystem,
    openLanguage,
    openAssistantFromHeader,
    logout,
  };
}
