/**
 * @file composables/app/useRuntimeModeFlags.js
 * @description Vue Composition API 기반 상태/행동 분리 모듈입니다. UI 컴포넌트의 복잡도를 낮추기 위해 사용됩니다.
 */

import {computed} from "vue";
import {usePlatformStore} from "@/stores/platformStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {useViewportStore} from "@/stores/viewportStore";
import {
  isActualAndroidRuntimeInfo,
  isActualAndroidWebViewRuntimeInfo,
} from "@/platform/runtime/runtimeModeHelpers";
import {
  hasBodyMobileLayoutMode,
  resolveCompactViewportFlag,
  resolveLayoutMode,
  shouldUseMobileLayoutForFlags,
} from "@/platform/layout/layoutModeHelpers";

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
    // 뷰포트 스토어 기준 컴팩트 해상도이거나, DOM 바디의 클래스 조건이 참인 경우를 helper에서 결합합니다.
    resolveCompactViewportFlag({
      isCompactViewport: viewportStore.isCompact,
      hasBodyMobileMode: hasBodyMobileLayoutMode(),
    })
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
   * 현재 앱 환경이 안드로이드 네이티브 WebView 앱 환경 기반인지 판별합니다.
   * @type {import("vue").ComputedRef<boolean>}
   * @see {@link createAndroidConfig} 안드로이드 타깃 빌드 설정 레퍼런스
   */
  const isAndroidApp = computed(() => Boolean(platformInfo.value.isAndroidApp));

  /**
   * 실제 Android 런타임 여부를 화면 크기와 분리하여 제공합니다.
   * @type {import("vue").ComputedRef<boolean>}
   */
  const isActualAndroidRuntime = computed(() =>
    isActualAndroidRuntimeInfo(platformInfo.value)
  );

  /**
   * 실제 Android WebView/App 런타임 여부를 화면 크기와 분리하여 제공합니다.
   * @type {import("vue").ComputedRef<boolean>}
   */
  const isActualAndroidWebViewRuntime = computed(() =>
    isActualAndroidWebViewRuntimeInfo(platformInfo.value)
  );

  /**
   * 네이티브 앱이 아닌, 모바일 기기의 지원 대상 Chrome 브라우저 환경인지 판별합니다.
   * 플랫폼 강제 설정은 런타임 테스트용으로만 사용하고, 레이아웃 전환은 실제 뷰포트/실제 모바일 런타임 기준을 따릅니다.
   * @type {import("vue").ComputedRef<boolean>}
   * @see {@link isAndroidChromeUserAgent} 순정 안드로이드 크롬 판단 로직 연동
   */
  const isMobileBrowser = computed(() => {
    const info = platformInfo.value;
    if (!info.isPlatformForced) return Boolean(info.isMobileBrowser);
    return Boolean(
      isActualAndroidRuntimeInfo(info) &&
      !isActualAndroidWebViewRuntimeInfo(info)
    );
  });

  /**
   * 해상도 조건(Compact), 안드로이드 앱 여부, 실제 모바일 브라우저 여부 중 하나라도 일치하여 최종적으로 모바일 전용 레이아웃을 송출해야 하는지 통합 판별합니다.
   * PC 브라우저에서 Android Chrome/WebView로 강제 플랫폼을 바꾸더라도 모바일 전환 기준 너비를 우회하지 않습니다.
   * @type {import("vue").ComputedRef<boolean>}
   */
  const shouldUseMobileLayout = computed(() =>
    // 반응형 변수들의 내부 프리미티브 값을 helper에 전달해 모바일 레이아웃 채택 여부를 계산합니다.
    shouldUseMobileLayoutForFlags({
      isCompactViewport: isCompactViewport.value,
      isAndroidApp: isAndroidApp.value,
      isMobileBrowser: isMobileBrowser.value,
      isAndroidWebView: platformInfo.value.isAndroidWebView,
    })
  );

  /**
   * 현재 레이아웃 모드를 문자열로 제공합니다.
   * @type {import("vue").ComputedRef<"mobile"|"desktop">}
   */
  const layoutMode = computed(() =>
    resolveLayoutMode({shouldUseMobileLayout: shouldUseMobileLayout.value})
  );

  const isMobileLayout = computed(() => layoutMode.value === "mobile");
  const isDesktopLayout = computed(() => layoutMode.value === "desktop");

  // 컴포넌트 내부의 <template> 또는 script 블록에서 유연하게 반응형 비즈니스 분기를 할 수 있도록 플래그 셋을 최종 반환합니다.
  return {
    platformInfo,
    isCompactViewport,
    isNativeRuntime,
    isAndroidApp,
    isActualAndroidRuntime,
    isActualAndroidWebViewRuntime,
    isMobileBrowser,
    shouldUseMobileLayout,
    layoutMode,
    isMobileLayout,
    isDesktopLayout,
  };
}
