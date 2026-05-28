<template>
  <div
    class="app-container"
    :class="containerClasses"
    :data-platform="platformName"
  >
    <slot />
  </div>
</template>

<script setup>
/**
 * @file containers/AppContainer.vue
 * @description 프로젝트 공통 JavaScript/Vue 모듈입니다. 하위 계층에서 재사용되는 상태, action, 렌더 보조 로직을 포함합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed} from "vue";
import {useAppContext} from "@/composables/app/useAppContext";
import {useRuntimeModeFlags} from "@/composables/app/useRuntimeModeFlags";

/**
 * @component AppContainer
 * @description 애플리케이션의 최상단 루트 레이아웃을 래핑하는 최상위 컨테이너 컴포넌트입니다.
 * 현재 실행 중인 기기 환경, 브라우저 유형, 뷰포트 상태를 분석하여 알맞은
 * BEM 규격의 CSS 모디파이어 클래스명들을 `<body>` 하위 요소에 동적으로 주입합니다.
 * * @see {@link useAppContext} 전역 부트스트랩 인프라 설정을 추출하는 훅
 * @see {@link useRuntimeModeFlags} 반응형 레이아웃 판별 플래그셋을 추출하는 훅
 */

// 1. 전역 애플리케이션 콘텍스트로부터 초기화 단계에 설정된 고유 앱 정보(`appInfo`)를 비동기 추출합니다.
const {appInfo} = useAppContext();

// 2. 실시간 런타임 상태 플래그 훅을 호출하여 플랫폼 세부 정보 및 모바일 레이아웃 채택 여부를 구조 분해 할당으로 가져옵니다.
const {platformInfo, shouldUseMobileLayout, isMobileBrowser} =
  useRuntimeModeFlags();

/**
 * 현재 애플리케이션이 구동 중인 실행 환경 명칭(env)을 우선 채택하고, 없을 경우 기기 플랫폼 명칭을 폴백으로 지정하는 반응형 변수입니다.
 * @type {import("vue").ComputedRef<string>}
 */
const platformName = computed(
  () => platformInfo.value.env || appInfo?.platform || "web"
);

/**
 * 현재 사용자 환경의 접속 웹 브라우저 종류(Chrome/WebView 지원 여부)를 안전하게 판별하는 반응형 변수입니다.
 * @type {import("vue").ComputedRef<string>}
 */
const browserName = computed(() => platformInfo.value.browser || "unknown");

/**
 * 현재 사용자 기기의 하드웨어 디바이스 유형(예: pc, android, iphone 등)을 안전하게 판별하는 반응형 변수입니다.
 * @type {import("vue").ComputedRef<string>}
 */
const deviceName = computed(() => platformInfo.value.device || "unknown");

/**
 * 컴팩트 해상도나 모바일 브라우저 조건 등을 고려하여, 현재 화면을 모바일 UI 규격으로 렌더링해야 하는지 최종 확정하는 플래그입니다.
 * @type {import("vue").ComputedRef<boolean>}
 * @see {@link useRuntimeModeFlags.shouldUseMobileLayout} 모바일 레이아웃 판단 소스 플래그
 */
const isMobileContainer = computed(() => shouldUseMobileLayout.value);

/**
 * 상기 계산된 개별 플랫폼 속성값들을 조합하여 템플릿의 컨테이너 Div에 실시간 매핑할 CSS 클래스 객체를 빌드합니다.
 * @type {import("vue").ComputedRef<Record<string, boolean>>}
 */
const containerClasses = computed(() => ({
  // 모바일 컨테이너 조건이 아닐 경우(일반 데스크톱 PC 화면인 경우) 전용 웹 스타일 클래스를 활성화합니다.
  "app-container--web": !isMobileContainer.value,

  // 모바일 컨테이너 조건에 부합할 경우 해상도가 좁축된 컴팩트 스타일 클래스를 활성화합니다.
  "app-container--compact": isMobileContainer.value,

  // 네이티브 앱 내부가 아닌 순수 모바일 크롬/사파리 등 브라우저로 접근한 상태일 때 결합할 특화 클래스입니다.
  "app-container--compact-browser": isMobileBrowser.value,

  // 현재 플랫폼 실행 환경 명칭에 매칭되는 동적 클래스를 항상 true 상태로 바인딩합니다. (예: app-container--native)
  [`app-container--${platformName.value}`]: true,

  // 현재 감지된 브라우저 엔진 명칭에 매칭되는 동적 클래스를 항상 true 상태로 바인딩합니다. (예: app-container--browser-chrome)
  [`app-container--browser-${browserName.value}`]: true,

  // 현재 접속한 하드웨어 디바이스 종류 명칭에 매칭되는 동적 클래스를 항상 true 상태로 바인딩합니다. (예: app-container--device-pc)
  [`app-container--device-${deviceName.value}`]: true,
}));
</script>
