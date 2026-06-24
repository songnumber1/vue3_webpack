/**
 * @file utils/applyViewportBreakpoint.js
 * @description 여러 영역에서 공유하는 유틸리티입니다. DOM/Markdown/feedback/viewport 보정 등 공통 처리를 담당합니다.
 */

import {useViewportStore} from "@/stores/viewportStore";
import {syncViewportModeClass} from "@/platform/viewport/viewportMode";
import {logPlatformDebug} from "@/platform/platformDebug";

/**
 * Applies the currently configured mobile breakpoint to every viewport runtime
 * consumer: body mode classes, the shared viewport store, and cached viewport
 * measurements.
 */
export function syncViewportSettings(breakpoint) {
  const viewportStore = useViewportStore();
  syncViewportModeClass(breakpoint);
  viewportStore.setBreakpoint(breakpoint);
  viewportStore.refresh();
  logPlatformDebug("viewport.settings.sync", {
    breakpoint,
    viewport: {
      width: viewportStore.width,
      visualWidth: viewportStore.visualWidth,
      isCompact: viewportStore.isCompact,
    },
  });
}
