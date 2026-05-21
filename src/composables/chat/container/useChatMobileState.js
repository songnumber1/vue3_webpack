import {ref} from "vue";

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
 * The decision intentionally combines the responsive breakpoint with the
 * platform store flags. This preserves desktop narrow-width behavior while
 * avoiding DOM class probing, which can lag behind reactive platform state
 * during mount/resume.
 */
export function useChatMobileState({isCompactScreen, platformInfo}) {
  const isMobile = ref(false);

  function updateMobileState() {
    isMobile.value = Boolean(
      isCompactScreen.value || shouldUseMobilePlatformLayout(platformInfo.value)
    );
  }

  return {
    isMobile,
    updateMobileState,
  };
}
