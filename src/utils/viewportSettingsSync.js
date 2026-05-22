import {useViewportStore} from "@/platform/viewport/viewportStore";
import {syncViewportModeClass} from "@/platform/viewport/viewportMode";

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
}
