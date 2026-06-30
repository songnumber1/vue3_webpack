/**
 * @file utils/syncMobileViewportSettings.js
 * @description 모바일 viewport class와 측정값을 동기화합니다.
 */

import {useViewportStore} from "@/stores/viewportStore";
import {syncViewportModeClass} from "@/platform/viewport/viewportMode";
import {logPlatformDebug} from "@/platform/platformDebug";

export function syncMobileViewportSettings() {
  const viewportStore = useViewportStore();
  syncViewportModeClass();
  viewportStore.refresh();
  logPlatformDebug("viewport.settings.sync", {
    viewport: {
      width: viewportStore.width,
      visualWidth: viewportStore.visualWidth,
      isCompact: viewportStore.isCompact,
    },
  });
}
