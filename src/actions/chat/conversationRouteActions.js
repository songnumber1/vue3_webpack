import {useChatStore} from "@/stores/chatStore";
import {
  applyConversationActiveRoom,
  createConversationRoute,
} from "@/composables/chat/internal/policy/chatRoutePolicy";

export async function navigateToConversation({
  router,
  chatId,
  replace = true,
  query,
} = {}) {
  const chatStore = useChatStore();
  const route = {
    ...createConversationRoute({chatId}),
    ...(query ? {query} : {}),
  };

  chatStore.setPendingSelectedChatId?.(chatId);
  const navigate = replace ? router?.replace : router?.push;

  try {
    return await navigate?.call(router, route);
  } finally {
    applyConversationActiveRoom({chatId});
  }
}
