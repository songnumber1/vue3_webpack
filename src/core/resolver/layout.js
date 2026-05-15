/**
 * @file layout.js
 * @description Resolves the single application shell component. Platform-specific UI is controlled by AppShell classes and appContext.
 */

import AppShell from "@/layouts/AppShell.vue";

/**
 * Returns the unified application shell.
 * @returns {*} Vue layout component.
 */
export function resolveLayout() {
  return AppShell;
}
