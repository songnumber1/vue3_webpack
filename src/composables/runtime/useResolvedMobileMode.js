/**
 * @file composables/runtime/useResolvedMobileMode.js
 * @description Final guard for mobile layout branching. It keeps Vue render-time
 * mobile decisions aligned with the global viewport/body mobile mode used by SCSS.
 */
import {computed} from "vue";
import {usePlatformStore} from "@/stores/platformStore";
import {useViewportStore} from "@/stores/viewportStore";

function shouldUseMobilePlatformLayout(platformInfo = {}) {
  if (platformInfo.isPlatformForced) {
    return Boolean(
      platformInfo.isAndroidApp ||
        platformInfo.isNativeApp ||
        platformInfo.isNativeRuntime ||
        (platformInfo.actualEnv === "android" &&
          platformInfo.actualRuntime !== "native")
    );
  }

  return Boolean(
    platformInfo.isMobileBrowser ||
      platformInfo.isAndroidApp ||
      platformInfo.isNativeApp ||
      platformInfo.isNativeRuntime
  );
}

function hasMobileBodyClass() {
  if (typeof document === "undefined") return false;
  return document.body?.classList?.contains("mobile-mode") || false;
}

/**
 * Combines the injected workspace mobile flag with the viewport store and the
 * body-mode class. This prevents a render branch from using desktop prompt
 * classes while the SCSS/runtime layer is already in mobile-mode.
 *
 * @param {import('vue').Ref<boolean>|import('vue').ComputedRef<boolean>} baseMobile
 * @returns {import('vue').ComputedRef<boolean>}
 */
export function useResolvedMobileMode(baseMobile) {
  const viewportStore = useViewportStore();
  const platformStore = usePlatformStore();

  return computed(() =>
    Boolean(
      baseMobile.value ||
        viewportStore.isCompact ||
        shouldUseMobilePlatformLayout(platformStore.info || {}) ||
        hasMobileBodyClass()
    )
  );
}
