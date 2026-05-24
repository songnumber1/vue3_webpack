import {useViewportStore} from "@/platform/viewport/viewportStore";
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
