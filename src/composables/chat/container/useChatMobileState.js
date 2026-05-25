/**
 * @file composables/chat/container/useChatMobileState.js
 * @description ChatContainer 전용 controller 계층입니다. route, UI 상태, scroll, modal, submit 흐름을 도메인별 composable로 조립합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed} from "vue";

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function shouldUseMobilePlatformLayout(platformInfo = {}) {
  return Boolean(
    platformInfo.isMobileBrowser || platformInfo.isAndroidApp
  );
}

/**
 * Keeps chat layout mobile state in one place.
 *
 * The mobile decision must stay fully reactive to the runtime breakpoint. When
 * the system setting changes from 768px to a wider value such as 1400px,
 * overlay/page components should immediately switch modes without waiting for a
 * resize event or a manual refresh callback.
 */
export function useChatMobileState({isCompactScreen, platformInfo}) {
  const isMobile = computed(() =>
    Boolean(
      isCompactScreen.value || shouldUseMobilePlatformLayout(platformInfo.value)
    )
  );

  function updateMobileState() {
    // Kept for existing resize/watch call sites. isMobile is computed, so the
    // actual state update is driven by viewportStore/platformStore reactivity.
  }

  return {
    isMobile,
    updateMobileState,
  };
}
