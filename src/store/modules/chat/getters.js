export default {
  safeStore: (s) => s.store,
  activeChat: (s) => {
    const store = s.store || {};
    const chats = Array.isArray(store.chats) ? store.chats : [];
    const id = store.activeChatId;
    return chats.find((c) => c.id === id) || null;
  },
  activeMessages: (s, g) => {
    const chat = g.activeChat;
    if (!chat) return [];
    return Array.isArray(chat.messages) ? chat.messages : [];
  },
  isDraft: (s) => !!(s.store && s.store.draft),
  activeChatTitle: (s, g) => {
    const chat = g.activeChat;
    return chat?.title || "Chat";
  },
};
