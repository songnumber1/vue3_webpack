/**
 * @file composables/chat/internal/navigation/portalAssistantNavigation.js
 * @description Studio/MCP 포털 Assistant 이동 순서를 한 곳에서 실행합니다.
 */

import {
  cleanupAfterPortalConversationNavigation,
  preparePortalConversationNavigation,
} from "@/composables/chat/internal/navigation/chatNavigationReset";
import {createPortalAssistantRoute} from "@/composables/chat/internal/navigation/portalAssistantRoutePolicy";

export async function navigateToPortalAssistant({
  router,
  assistantStore,
  assistantId,
  resetContext,
  afterSelect,
} = {}) {
  const targetRoute = createPortalAssistantRoute(assistantId);

  preparePortalConversationNavigation(resetContext);
  assistantStore.selectAssistant(assistantId);
  if (typeof afterSelect === "function") afterSelect();
  await router?.push(targetRoute).catch(() => {});
  cleanupAfterPortalConversationNavigation(resetContext);
}
