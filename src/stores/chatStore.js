import { MODEL_GROUPS, getDefaultModelId } from "@/constants/models";

const KEY = "ds_chat_store_v2";

function nowId() {
  return Date.now().toString();
}

function nowTs() {
  return Date.now();
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
      draft: parsed.draft ?? !parsed.activeChatId,
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
  const safe = String(firstText ?? "");
  const title = (safe || "New Chat").trim().slice(0, 24);
  const ts = nowTs();
  return {
    id: nowId(),
    title,
    messages: [],
    createdAt: ts,
    lastAt: ts,
  };
}

function normalizeChat(chat) {
  const c = chat && typeof chat === "object" ? chat : {};
  const messages = Array.isArray(c.messages) ? c.messages : [];

  // message ts 보정
  const fixedMessages = messages.map((m) => {
    const mm = m && typeof m === "object" ? m : {};
    return {
      role: mm.role || "user",
      text: String(mm.text ?? ""),
      ts: typeof mm.ts === "number" ? mm.ts : null,
    };
  });

  // lastAt 계산
  let lastAt = typeof c.lastAt === "number" ? c.lastAt : null;
  if (!lastAt) {
    const lastMsg = fixedMessages[fixedMessages.length - 1];
    if (lastMsg && typeof lastMsg.ts === "number") lastAt = lastMsg.ts;
  }
  if (!lastAt) lastAt = typeof c.createdAt === "number" ? c.createdAt : nowTs();

  return {
    id: c.id ?? nowId(),
    title: String(c.title ?? "New Chat"),
    messages: fixedMessages,
    modelGroupId: c.modelGroupId,
    modelId: c.modelId,
    createdAt: typeof c.createdAt === "number" ? c.createdAt : lastAt,
    lastAt,
  };
}

export function normalizeStore(s) {
  const safe = s && typeof s === "object" ? s : {};
  const fallbackGroup = MODEL_GROUPS?.[0]?.id || "ds";
  const groupId = safe.activeModelGroupId || fallbackGroup;

  const chats = (Array.isArray(safe.chats) ? safe.chats : []).map(normalizeChat);

  return {
    chats,
    activeChatId: safe.activeChatId ?? null,
    draft: safe.draft ?? !safe.activeChatId,
    activeModelGroupId: groupId,
    activeModelId: safe.activeModelId || getDefaultModelId(groupId),
  };
}

/**
 * ✅ 메시지 추가 시 chat.lastAt / message.ts 업데이트를 위한 헬퍼
 */
export function touchChatOnMessage(chat, message) {
  const ts = nowTs();
  if (!message.ts) message.ts = ts;
  chat.lastAt = ts;
}
