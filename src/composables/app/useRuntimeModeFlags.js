/**
 * @file composables/app/useRuntimeModeFlags.js
 * @description 모바일 전용 UI에서 사용하는 런타임 플래그를 제공합니다.
 */

import {computed} from "vue";
import {usePlatformStore} from "@/stores/platformStore";

function isAndroidRuntimeInfo(info = {}) {
  return Boolean(info.isAndroid || info.isAndroidApp || info.isAndroidWebView);
}

function isAndroidWebViewRuntimeInfo(info = {}) {
  return Boolean(info.isAndroidWebView || info.isAndroidApp);
}

export function useRuntimeModeFlags() {
  const platformStore = usePlatformStore();
  const platformInfo = computed(() => platformStore.info || {});

  const isNativeRuntime = computed(() =>
    Boolean(
      platformInfo.value.isNativeRuntime || platformInfo.value.isNativeApp
    )
  );
  const isAndroidApp = computed(() => Boolean(platformInfo.value.isAndroidApp));
  const isActualAndroidRuntime = computed(() =>
    isAndroidRuntimeInfo(platformInfo.value)
  );
  const isActualAndroidWebViewRuntime = computed(() =>
    isAndroidWebViewRuntimeInfo(platformInfo.value)
  );

  return {
    platformInfo,
    isNativeRuntime,
    isAndroidApp,
    isActualAndroidRuntime,
    isActualAndroidWebViewRuntime,
    isBrowserRuntime: computed(() => Boolean(platformInfo.value.isBrowserRuntime)),
  };
}
