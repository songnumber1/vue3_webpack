
import { reactive } from 'vue';

const state = reactive({
  chats: [],
  activeChatId: null,
  sidebarOpen: false,
});

export function useChatStore() {
  const selectChat = (id) => {
    state.activeChatId = id;
  };

  return {
    state,
    selectChat,
  };
}
