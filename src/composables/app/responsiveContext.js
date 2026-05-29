/**
 * @file composables/app/responsiveContext.js
 * @description 반응형 레이아웃 상태를 props drilling 없이 하위 화면에 제공하기 위한 provide/inject context입니다.
 */

import {computed, inject} from "vue";
import {storeToRefs} from "pinia";
import {useResponsiveLayoutStore} from "@/stores/responsiveLayoutStore";

export const RESPONSIVE_CONTEXT_KEY = "RESPONSIVE_CONTEXT";

function createStoreBackedResponsiveContext() {
  const store = useResponsiveLayoutStore();
  const {
    isMobile,
    isDesktop,
    isCompactViewport,
    isMobileBrowser,
    isAndroidApp,
    isAndroidWebView,
    effectiveWidth,
    effectiveHeight,
  } = storeToRefs(store);

  return computed(() => ({
    isMobile: isMobile.value,
    isDesktop: isDesktop.value,
    isCompactViewport: isCompactViewport.value,
    isMobileBrowser: isMobileBrowser.value,
    isAndroidApp: isAndroidApp.value,
    isAndroidWebView: isAndroidWebView.value,
    effectiveWidth: effectiveWidth.value,
    effectiveHeight: effectiveHeight.value,
  }));
}

export function useResponsiveContext() {
  return inject(RESPONSIVE_CONTEXT_KEY, createStoreBackedResponsiveContext());
}
