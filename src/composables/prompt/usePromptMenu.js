/**
 * @file composables/prompt/usePromptMenu.js
 * @description 프롬프트 입력 도메인 composable입니다. 텍스트/첨부/도구/모델 선택 상태와 submit emit을 관리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, onBeforeUnmount, ref, watch} from "vue";
import {useEventListener, useWindowSize} from "@vueuse/core";
import {useOutsideClick} from "@/composables/events/useOutsideClick";
import {PROMPT_MENU_TYPE} from "@/constants/promptComposer";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {usePlatformStore} from "@/stores/platformStore";

/**
 * @function createMenuOpenRef
 * @description [상호 배제형 헬퍼 클로저] 복수의 확장 메뉴가 동시 다발적으로 팝업되는 결함을 차단하기 위해,
 * 단 하나의 전역 활성 레퍼런스(`activeMenu`)를 공유하여 읽기/쓰기를 수행하는 2-Way 반응형 커스텀 computed 인스턴스를 빌드합니다.
 * @param {Ref<string|null>} activeMenu - 현재 유일하게 열려있는 메뉴 식별자 상태 고리
 * @param {string} menuType - 본 인스턴스가 전담 방어할 메뉴 고유 카테고리 명칭 (model, tool, attach 등)
 * @returns {WritableComputedRef<boolean>} HTML 템플릿의 v-model 또는 개폐 바인딩에 즉시 이식 가능한 boolean 헬퍼 래퍼
 */
/**
 * 호출 흐름에서 재사용할 객체, 상태, context 또는 handler를 생성합니다.
 */
function createMenuOpenRef(activeMenu, menuType) {
  return computed({
    get: () => activeMenu.value === menuType,
    set: (open) => {
      if (open) {
        activeMenu.value = menuType; // 특정 메뉴를 열면 기존 활성화되어 있던 다른 메뉴는 자동으로 null 처리되며 닫힙니다.
        return;
      }
      if (activeMenu.value === menuType) activeMenu.value = null;
    },
  });
}

/**
 * @function usePromptMenu
 * @description 입력 툴바의 하위 메뉴 상태 전개, 모바일 레이아웃 폴백 가드,
 * 그리고 돔 최외각 스크롤 락 클래스 부여를 총괄 대행하는 UI 오케스트레이션 컴포저블입니다.
 */
export function usePromptMenu() {
  const systemSettingsStore = useSystemSettingsStore();
  const platformStore = usePlatformStore();
  const {width} = useWindowSize();

  // 툴바 하위 컴포넌트들의 마스터 DOM 참조점들이 맵 구조로 주입될 앵커 포인터
  const toolbarRef = ref(null);
  // 현재 활성화되어 화면을 점유 중인 메뉴의 실시간 단일 밸류 상태
  const activeMenu = ref(null);

  // 상호 배제형 인스턴스 팩토리 주입 바인딩 개통
  const modelMenuOpen = createMenuOpenRef(activeMenu, PROMPT_MENU_TYPE.model); // AI 모델 서랍
  const toolMenuOpen = createMenuOpenRef(activeMenu, PROMPT_MENU_TYPE.tool); // 확장 기능 플러그인 서랍
  const attachMenuOpen = createMenuOpenRef(activeMenu, PROMPT_MENU_TYPE.attach); // 클립 파일 첨부 서랍

  // 현재 브라우저의 너비 사양이 시스템 모바일 중단점(Breakpoint) 이하로 압축되었는지 감지하는 플래그
  const isPromptCompactViewport = computed(
    () => width.value <= systemSettingsStore.mobileBreakpoint
  );
  const isForcedMobilePlatform = computed(() =>
    Boolean(
      platformStore.info?.isMobileBrowser ||
        platformStore.info?.isAndroidApp ||
        platformStore.info?.isPlatformForced ||
        (typeof document !== "undefined" &&
          document.body?.classList?.contains("mobile-mode"))
    )
  );
  // 모바일 뷰포트 사양 가이드와 가상 키보드 충돌 요소를 계산하여 최종 '모바일 바텀시트' 형태로 서랍을 분출할지 판별하는 플래그
  const isMobileSheet = ref(false);

  /**
   * @function syncPromptMenuClass
   * @description 메뉴가 열릴 때 최상단 document 엘리먼트에 전용 CSS 클래스(`is-prompt-menu-open`)를 토글 부여합니다.
   * 이를 통해 모바일 환경에서 바텀시트가 팝업되었을 때 뒨배경 본문이 혼자 휠 스크롤되는 현상(Scroll Bubbling)을 글로벌 스타일 시트로 방어합니다.
   */
  function syncPromptMenuClass() {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle(
      "is-prompt-menu-open",
      Boolean(activeMenu.value)
    );
  }

  /**
   * 데스크톱 웹 해상도와 모바일 뷰포트 사양 간의 인터페이스 마운트 모드를 동적 최신화합니다.
   */
  function syncViewportMode() {
    isMobileSheet.value = Boolean(isPromptCompactViewport.value || isForcedMobilePlatform.value);
  }

  /**
   * [일괄 청소 리셋] 활성화되어 있는 모든 입력창 하위 메뉴 세션을 일괄 소거 폐쇄합니다.
   */
  function closeMenus(except = "") {
    if (except && activeMenu.value === except) return;
    activeMenu.value = null;
  }

  function openMenu(menuType) {
    activeMenu.value = menuType;
  }

  function closeMenu(menuType) {
    if (!menuType || activeMenu.value === menuType) activeMenu.value = null;
  }

  /**
   * 특정 메뉴 버튼을 반복 연타 클릭했을 때 팝업을 스위칭 개폐하는 범용 토글 허브 메서드입니다.
   */
  function toggleMenu(menuType) {
    activeMenu.value = activeMenu.value === menuType ? null : menuType;
  }

  /**
   * 자식 템플릿 영역에 마운트된 특정 메뉴 엘리먼트의 원시 DOM 레퍼런스 수집 게터 함수입니다.
   */
  function getToolbarRoot(key) {
    const root = toolbarRef.value?.[key];
    return root?.value || root || null;
  }

  // ── 🖱️ [외부 영역 아웃사이드 클릭 디텍팅 가드] ──────────────────
  // 메뉴가 활성화된 상태에서 팝업창 본체 바깥의 빈 공간이나 대화창 영역을 마우스로 클릭하면 자동으로 드롭다운 메뉴를 청소 소거합니다.
  useOutsideClick(
    [
      () => getToolbarRoot("modelRoot"),
      () => getToolbarRoot("toolRoot"),
      () => getToolbarRoot("attachRoot"),
    ],
    closeMenus,
    // [중요 가드] 모바일 모드인 경우에는 아웃사이드 클릭 판단을 원천 무효화합니다.
    // 모바일은 풀 오버레이 바텀시트가 화면 전체를 장악하며, 전용 암전 백드롭 레이어가 클릭 닫기 이벤트를 전담 스크리닝하기 때문입니다.
    {shouldIgnore: () => isMobileSheet.value}
  );

  // 메뉴 상태가 바뀔 때마다 즉각 도큐먼트 바디 스타일 클래스를 동기화 수립합니다.
  watch(activeMenu, syncPromptMenuClass, {immediate: true});

  // ── 🧹 [컴포넌트 생명주기 마감: 좀비 스타일 클래스 박멸 청소] ──────────────────
  // 유저가 질문 입력을 중단하고 뒤로가기나 메인 대화방 이탈 등으로 컴포넌트가 파괴될 때,
  // document 최외각 돔에 잔존마킹된 `is-prompt-menu-open` 흔적 클래스를 완전히 강제 제거하여 서비스 전체 화면이 먹통 잠금되는 치명적 UI 결함을 차단합니다.
  onBeforeUnmount(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("is-prompt-menu-open");
    }
  });

  watch([isPromptCompactViewport, isForcedMobilePlatform], syncViewportMode);

  // ── 📱 [하드웨어 가상 키보드 팽창 및 해상도 리사이즈 이벤트 버스 개통] ──────────────────
  useEventListener(window, "resize", syncViewportMode, {passive: true});
  useEventListener(window, "orientationchange", syncViewportMode, {
    passive: true,
  }); // 모바일 화면 가로/세로 회전 대응

  // iOS 사파리 및 안드로이드 하이브리드 크롬 웹뷰의 특수 가상 키보드 인입 메커니즘을 완벽 방어하기 위해
  // 표준 윈도우 리사이즈뿐만 아니라 `visualViewport` 인터페이스의 수축/팽창/스크롤 모션까지 이중 추적 바인딩 개통합니다.
  if (typeof window !== "undefined" && window.visualViewport) {
    useEventListener(window.visualViewport, "resize", syncViewportMode, {
      passive: true,
    });
    useEventListener(window.visualViewport, "scroll", syncViewportMode, {
      passive: true,
    });
  }

  // 입력창 영역 뷰 컴포넌트 마크업 구조체 바인딩 주입용 마스터 팩 분출
  return {
    toolbarRef,
    activeMenu,
    modelMenuOpen,
    toolMenuOpen,
    attachMenuOpen,
    isMobileSheet,
    syncViewportMode,
    closeMenus,
    openMenu,
    closeMenu,
    toggleMenu,
    getToolbarRoot,
  };
}
