import { MODEL_GROUPS, getDefaultModelId } from "@/constants/models";

const KEY = "ds_chat_store_v2";

function nowId() {
  return Date.now().toString();
}

export function loadStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const firstGroup = MODEL_GROUPS?.[0]?.id || "ds";
      return {
        chats: [],
        activeChatId: null,
        draft: true,
        activeModelGroupId: firstGroup,
        activeModelId: getDefaultModelId(firstGroup),
      };
    }
    const parsed = JSON.parse(raw);
    const fallbackGroup = MODEL_GROUPS?.[0]?.id || "ds";
    const groupId = parsed.activeModelGroupId || fallbackGroup;
    return {
      chats: Array.isArray(parsed.chats) ? parsed.chats : [],
      activeChatId: parsed.activeChatId ?? null,
      draft: parsed.draft ?? true,
      activeModelGroupId: groupId,
      activeModelId: parsed.activeModelId || getDefaultModelId(groupId),
    };
  } catch (e) {
    const firstGroup = MODEL_GROUPS?.[0]?.id || "ds";
    return {
      chats: [],
      activeChatId: null,
      draft: true,
      activeModelGroupId: firstGroup,
      activeModelId: getDefaultModelId(firstGroup),
    };
  }
}

export function saveStore(state) {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      chats: state.chats,
      activeChatId: state.activeChatId,
      draft: state.draft,
      activeModelGroupId: state.activeModelGroupId,
      activeModelId: state.activeModelId,
    })
  );
}

export function createChatFromFirstMessage(firstText) {
  const title = (firstText || "New Chat").trim().slice(0, 24);
  return { id: nowId(), title, messages: [] };
}

export function normalizeStore(s) {
  const safe = s && typeof s === "object" ? s : {};
  const fallbackGroup = MODEL_GROUPS?.[0]?.id || "ds";
  const groupId = safe.activeModelGroupId || fallbackGroup;
  return {
    chats: Array.isArray(safe.chats) ? safe.chats : [],
    activeChatId: safe.activeChatId ?? null,
    draft: safe.draft ?? !safe.activeChatId,
    activeModelGroupId: groupId,
    activeModelId: safe.activeModelId || getDefaultModelId(groupId),
  };
}
