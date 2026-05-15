/**
 * @file layout.js
 * @description Resolves the root application container component. Platform-specific UI is controlled by AppContainer classes and appContext.
 */

import AppContainer from "@/containers/AppContainer.vue";

/**
 * Returns the unified application container.
 * @returns {*} Vue layout component.
 */
export function resolveLayout() {
  return AppContainer;
}
