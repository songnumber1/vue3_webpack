const KEY = "ds_chat_store_v1";

function nowId() {
  return Date.now().toString();
}

export function loadStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { chats: [], activeChatId: null, draft: true };
    const parsed = JSON.parse(raw);
    return {
      chats: Array.isArray(parsed.chats) ? parsed.chats : [],
      activeChatId: parsed.activeChatId ?? null,
      draft: parsed.draft ?? true,
    };
  } catch (e) {
    return { chats: [], activeChatId: null, draft: true };
  }
}

export function saveStore(state) {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      chats: state.chats,
      activeChatId: state.activeChatId,
      draft: state.draft,
    })
  );
}

export function createChatFromFirstMessage(firstText) {
  const title = (firstText || "New Chat").trim().slice(0, 24);
  return { id: nowId(), title, messages: [] };
}
