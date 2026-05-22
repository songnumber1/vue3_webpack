import {computed} from "vue";

function shouldUseMobilePlatformLayout(platformInfo = {}) {
  return Boolean(
    platformInfo.isMobileBrowser ||
      platformInfo.isAndroidApp ||
      platformInfo.isIosApp
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
