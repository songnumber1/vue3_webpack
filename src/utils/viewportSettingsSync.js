/**
 * @file utils/viewportSettingsSync.js
 * @description 여러 영역에서 공유하는 유틸리티입니다. DOM/Markdown/feedback/viewport 보정 등 공통 처리를 담당합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
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
