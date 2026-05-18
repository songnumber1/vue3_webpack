import {ref} from "vue";

function isMobilePlatform(platformInfo = {}) {
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
 * avoiding DOM class probing such as `.app-container--mobile`, which can lag
 * behind reactive platform state during mount/resume.
 */
export function useChatMobileState({isCompactScreen, platformInfo}) {
  const isMobile = ref(false);

  function updateMobileState() {
    isMobile.value = Boolean(
      isCompactScreen.value || isMobilePlatform(platformInfo.value)
    );
  }

  return {
    isMobile,
    updateMobileState,
  };
}
