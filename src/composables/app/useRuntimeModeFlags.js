import {computed} from "vue";
import {usePlatformStore} from "@/stores/platformStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {useViewportStore} from "@/platform/viewport/viewportStore";

/**
 * HTML의 `<body>` 태그가 모바일 클래스(`mobile-mode`)를 가지고 있는지 직접 판별합니다.
 * @returns {boolean} body 태그에 모바일 모드 클래스가 포함되어 있다면 true, 아니면 false
 * @see {@link installViewportModeClass} 최상단 진입점에서 전역 클래스를 주입하는 유틸리티
 */
function hasBodyMobileMode() {
  // 브라우저 런타임 환경(document 객체가 존재)이면서, body 객체의 classList 배열 내에 'mobile-mode'가 존재하는지 검사합니다.
  return (
    typeof document !== "undefined" &&
    document.body?.classList?.contains("mobile-mode")
  );
}

/**
 * 플랫폼 환경 상태 스토어 및 뷰포트 상태 스토어를 결합하여 현재 기기 조건에 알맞은 다양한 레이아웃/런타임 반응형 플래그들을 제공합니다.
 * @returns {Object} 반응형 계산된 속성(Computed) 플래그 묶음 객체
 * @see {@link bootstrap} 애플리케이션 초기화 단계에서 각 스토어를 세팅하는 진입점
 */
export function useRuntimeModeFlags() {
  // 플랫폼 식별 정보(앱, 웹뷰, 브라우저 종류 등)를 관리하는 전역 스토어 인스턴스를 가져옵니다.
  const platformStore = usePlatformStore();

  // 모바일 기준 해상도(breakpoint) 정보가 담긴 시스템 세팅 스토어 인스턴스를 가져옵니다.
  const systemSettingsStore = useSystemSettingsStore();

  // 실시간 브라우저 해상도 축소 여부를 감지하는 뷰포트 상태 스토어 인스턴스를 가져옵니다.
  const viewportStore = useViewportStore();

  // 시스템 설정 스토어에 지정된 모바일 기준 브레이크포인트 값으로 뷰포트 감지 기준점을 강제 재설정합니다.
  viewportStore.setBreakpoint(systemSettingsStore.mobileBreakpoint);

  /**
   * 플랫폼 스토어 내부의 원본 세부 정보 객체(`info`)를 안전하게 반환받는 반응형 객체입니다.
   * @type {import("vue").ComputedRef<Object>}
   */
  const platformInfo = computed(() => platformStore.info || {});

  /**
   * 화면 해상도가 작거나, HTML 바디 태그 자체에 모바일 강제 플래그가 선언되어 실질적인 모바일 뷰포트 상태인지 판별합니다.
   * @type {import("vue").ComputedRef<boolean>}
   */
  const isCompactViewport = computed(() =>
    // 뷰포트 스토어 기준 컴팩트 해상도이거나, DOM 바디의 클래스 조건이 참인 경우를 단언(Boolean)하여 캐싱합니다.
    Boolean(viewportStore.isCompact || hasBodyMobileMode())
  );

  /**
   * 현재 구동 중인 환경이 하이브리드 앱 내부(웹뷰 기반 네이티브 앱) 형태인지 판별합니다.
   * @type {import("vue").ComputedRef<boolean>}
   */
  const isNativeRuntime = computed(() =>
    // 플랫폼 정보의 네이티브 런타임 플래그 혹은 네이티브 앱 플래그 중 하나라도 켜져 있는지 확인합니다.
    Boolean(
      platformInfo.value.isNativeRuntime || platformInfo.value.isNativeApp
    )
  );

  /**
   * 현재 앱 환경이 iOS가 아닌 '안드로이드 네이티브 앱' 환경 기반인지 판별합니다.
   * @type {import("vue").ComputedRef<boolean>}
   * @see {@link createAndroidConfig} 안드로이드 타깃 빌드 설정 레퍼런스
   */
  const isAndroidApp = computed(() => Boolean(platformInfo.value.isAndroidApp));

  /**
   * 네이티브 앱이 아닌, 모바일 기기의 순수 모바일 웹 브라우저(Safari, Chrome Mobile 등) 환경인지 판별합니다.
   * @type {import("vue").ComputedRef<boolean>}
   * @see {@link isAndroidChromeUserAgent} 순정 안드로이드 크롬 판단 로직 연동
   */
  const isMobileBrowser = computed(() =>
    Boolean(platformInfo.value.isMobileBrowser)
  );

  /**
   * 해상도 조건(Compact), 안드로이드 앱 여부, 모바일 브라우저 여부 중 하나라도 일치하여 최종적으로 모바일 전용 레이아웃을 송출해야 하는지 통합 판별합니다.
   * @type {import("vue").ComputedRef<boolean>}
   */
  const shouldUseMobileLayout = computed(() =>
    // 반응형 변수들의 내부 프리미티브 값을 추출(.value)하여 결합 연산을 진행합니다.
    Boolean(
      isCompactViewport.value || isAndroidApp.value || isMobileBrowser.value
    )
  );

  // 컴포넌트 내부의 <template> 또는 script 블록에서 유연하게 반응형 비즈니스 분기를 할 수 있도록 플래그 셋을 최종 반환합니다.
  return {
    platformInfo,
    isCompactViewport,
    isNativeRuntime,
    isAndroidApp,
    isMobileBrowser,
    shouldUseMobileLayout,
  };
}
