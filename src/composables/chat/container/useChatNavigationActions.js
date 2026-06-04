/**
 * @file composables/chat/container/useChatNavigationActions.js
 * @description ChatContainer 전용 controller 계층입니다. route, UI 상태, scroll, modal, submit 흐름을 도메인별 composable로 조립합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {nextTick} from "vue";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {logWarn} from "@/utils/logger";
import {authApiLive} from "@/api/live/authApi.live";
import {useAuthStore} from "@/stores/authStore";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {useChatStore} from "@/stores/chatStore";

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

  /**
   * @description 현재 백엔드 LLM과 실시간 스트리밍 패킷 수신이 진행 중인지 감지하는 무결성 검증 세이프 가드입니다.
   * @returns {boolean} 스트리밍 가동 중 여부
   */
  function isBlockedByStream() {
    return chatStreamStore.isStreaming;
  }

  /**
   * @description [내부 공통 로직] 대화 타임라인을 파괴 비우고 메모리 누수를 막기 위해 파일 리소스를 취소 처리한 뒤 초기 메인 대시보드로 라우팅 이탈합니다.
   * @param {object} [options={}] - 신규 대화 초기화 커스텀 옵션 패킷
   * @param {string|null} [options.assistantId=null] - 새로운 채팅방 개통과 동시에 특정 어시스턴트를 자동 낙점 선택하고자 할 때 주입하는 ID 포인터
   */
  async function resetChatState({assistantId = null} = {}) {
    if (isBlockedByStream()) return; // 스트리밍 락 발동 시 명령 전격 거부

    // 메모리 누수 방지 가드: 대화방을 완전히 나가거나 초기화하므로 가비지 컬렉터 유도를 위해 첨부파일 인메모리 임시 URL 전원 소멸 폐기
    revokeMessageAttachments(messages.value);
    messages.value = []; // 대화창 배열 원자적 증발

    if (assistantId) {
      try {
        // 어시스턴트를 교체 지정하며 진입하는 국면인 경우 서비스단에 타깃 인자를 전달하여 신규 대화 모드 점화
        await selectAssistant(assistantId, {forNewChat: true});
      } catch (error) {
        logWarn("[useChatNavigationActions] selectAssistant 오류:", error);
      }
      assistantSheetOpen.value = false; // 연동 바텀시트 가인드 폐쇄
    } else {
      clearActiveSession(); // 일반 새 대화 개통 시 활성 채팅방 세션 포인터를 깔끔하게 증발 소멸
    }

    navigationStore.closeTransientPanels(); // 화면에 열려 있던 임시 우측 사이드 패널 등 일괄 수거 클로즈
    clearForceBottom(); // 하단 스크롤 강제 락 전격 오프

    // 메인 홈 화면 주소로 안전하게 인앱 주 주소 전환 집행 (중복 라우팅 에러 전파 방어)
    await router.push({name: "main"}).catch(() => {});
  }

  // 외부 노출 인터페이스 명칭을 도메인에 직관적인 'startNewChat' 별칭 명세로 동기 미러 바인딩 처리
  const startNewChat = resetChatState;

  /**
   * @description 사용자가 히스토리 사이드바에서 과거 특정 대화 내역 항목을 클릭했을 때 해당 채팅방 고유 주소 파라미터(UUID)를 셋업하여 방을 이동합니다.
   * @param {object} item - 라우팅 타깃이 된 특정 대화방 히스토리 로우 오브젝트
   */
  async function openHistory(item) {
    if (isBlockedByStream()) return false;
    const historyId = String(item?.id || "").trim();
    if (!historyId) return false;

    navigationStore.closeTransientPanels(); // 대화 맥락이 바뀌므로 열려 있던 우측 정보 패널들 강제 셧다운
    // 모바일/좁은 화면에서는 대용량 대화방 historyRender overlay가 시작되기 전에
    // 좌측 드로어와 접힌 최근 목록을 먼저 닫아 로딩 화면과 메뉴가 겹쳐 보이지 않게 합니다.
    navigationStore.setDrawerOpen(false);
    navigationStore.setCollapsedRecentOpen(false);

    const currentId = String(chatStore.selectedChatId || "").trim();
    const pendingId = String(chatStore.pendingSelectedChatId || "").trim();
    if (historyId === currentId && !pendingId) {
      chatStore.stopHistoryNavigationLoading();
      return true;
    }

    chatStore.setPendingSelectedChatId(historyId);
    // 기존 apiRequestStore.startOverlay()를 직접 호출하면 beginHistoryRender()의
    // overlay count와 중첩되어 progress가 남을 수 있습니다. 별도 UI flag로
    // 클릭 즉시 표시만 보장하고, 실제 historyRender 종료 지점에서 정리합니다.
    chatStore.startHistoryNavigationLoading();

    try {
      const navigationFailure = await router.push({
        name: "chat",
        params: {id: historyId},
      });
      if (navigationFailure) {
        // 라우터가 이동을 취소/중복 처리하면 route watcher가 실행되지 않을 수 있습니다.
        chatStore.stopHistoryNavigationLoading();
      }
    } catch (error) {
      void error;
      // 예외성 네비게이션 실패로 loadRouteConversation이 이어지지 않는 경우
      // 클릭 선반영 progress가 고착되지 않도록 즉시 회수합니다.
      chatStore.stopHistoryNavigationLoading();
    }
    return true;
  }

  /**
   * @description 라이트 모드 <-> 다크 모드 스타일 레이어를 반전 토글하고, 이에 대응하여 메시지 리스트에 내장된 Mermaid.js 기반 순서도/다이어그램 그래프의 색상 스키마를 강제 리렌더링 보정합니다.
   */
  async function toggleTheme() {
    if (isBlockedByStream()) return;
    try {
      theme.toggle(); // 글로벌 하드웨어 테마 쿠키/로컬스토리지 스위칭 연동
      themeName.value = theme.current; // 현재 모드 런타임 캐싱 업데이트

      await nextTick(); // Vue DOM 트리 상에 다크/라이트 CSS 클래스명이 전격 주입 정착되는 프레임 대기

      // [중요 인프라 가드]: 테마 백그라운드가 바뀌면 흰색/검은색 선이 가려지므로 돔 요소를 수색하여 인라인 SVG 머메이드 다이어그램 코드를 강제 강도 압착 재생성
      await renderMermaidInElement(document.querySelector(".message-list"), {
        force: true,
      });

      // 차트 재생성으로 인해 채팅창 총 길이가 변동될 수 있으므로 스테이블 모드로 하단 최적화 스크롤 복구 안착
      scrollBottom({stable: true});
    } catch (error) {
      logWarn("[useChatNavigationActions] toggleTheme 오류:", error);
    }
  }

  // 시스템 API 개발서 전용 주소창 다이렉트 점프
  function openSwagger() {
    if (isBlockedByStream()) return;
    router.push("/swagger").catch(() => {});
  }

  // 프롬프트 및 API 테스트 전용 실험실(Playground) 화면 이동 (이동 시 사이드 드로어는 눈을 가리기 위해 닫기 처리)
  function openPlayground() {
    if (isBlockedByStream()) return;
    navigationStore.setDrawerOpen(false);
    router.push({name: "playground"}).catch(() => {});
  }

  // 모바일 환경에서 가상 키보드 튐이나 인풋 포커스 록을 깨부수고 부드럽게 좌측 사이드 메뉴 드로어를 슬라이딩 노출합니다.
  function openMobileDrawer() {
    if (isBlockedByStream()) return;

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
    if (isBlockedByStream()) return;
    if (isMobile.value) {
      navigationStore.setDrawerOpen(false); // 모바일은 드로어를 등 뒤로 끄고 전체화면 세팅 팝업 로드
      mobileSettingsOpen.value = true;
      return;
    }
    openPersonalization(); // 데스크톱은 개인화 관리 중앙 데시보드 모달 매핑 실행
  }

  // 이용 가이드라인 가이드북 라우팅 화면 점프
  function openGuide() {
    if (isBlockedByStream()) return;
    navigationStore.setDrawerOpen(false);
    router.push({name: "guide"}).catch(() => {});
  }

  // 시스템 전체 공지사항 모달 가시 노출 활성화
  function openNotice() {
    if (isBlockedByStream()) return;
    navigationStore.setDrawerOpen(false);
    noticeOpen.value = true;
  }

  // 서비스 개인정보 처리방침 규약 모달 가시 노출 활성화
  function openPrivacy() {
    if (isBlockedByStream()) return;
    navigationStore.setDrawerOpen(false);
    privacyOpen.value = true;
  }

  // 서비스 공식 이용약관 서면 페이지 라우팅 이동
  function openTerms() {
    if (isBlockedByStream()) return;
    navigationStore.setDrawerOpen(false);
    router.push({name: "terms"}).catch(() => {});
  }

  // 시스템 커스텀 마이페이지 개인화 모달 팝업 개통
  function openPersonalization() {
    if (isBlockedByStream()) return;
    navigationStore.setDrawerOpen(false);
    personalizationOpen.value = true;
  }

  // 인프라 운영 모니터링 및 코어 시스템 정보 가이드 모달 개통
  function openSystem() {
    if (isBlockedByStream()) return;
    navigationStore.setDrawerOpen(false);
    systemOpen.value = true;
  }

  // 다국어 글로벌 번역 체인지 전용 바텀시트 활성화
  function openLanguage() {
    if (isBlockedByStream()) return;
    languageSheetOpen.value = true;
  }

  /**
   * @description 백엔드 라이브 인증 세션 서버에 로그아웃 HTTP 요청을 무효화 집행하고, 통신 성공 여부와 상관없이 클라이언트 전역 인증 토큰/프로필 컨텍스트 스토어를 영구 리셋 포맷한 뒤 로그인 필수 화면으로 추방 라우트 전환합니다.
   */
  async function logout() {
    if (isBlockedByStream()) return;
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
    if (isBlockedByStream()) return;
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
