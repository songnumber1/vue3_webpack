import { defineStore } from "pinia";
import { useDataStore } from "./dataStore";
import { JSON_KEYS } from "@/constants/jsonKeys";

const LS_KEY = "ds_chat_state_v3";
// ✅ Legacy key (older build) – migrate once if present.
const LEGACY_LS_KEY = "ds_chat_store_v2";

function nowTs() {
  return Date.now();
}

function safeParse(jsonStr, fallback) {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return fallback;
  }
}

function migrateLegacyV2IfNeeded() {
  try {
    const hasV3 = !!localStorage.getItem(LS_KEY);
    if (hasV3) return null;
    const raw = localStorage.getItem(LEGACY_LS_KEY);
    if (!raw) return null;
    const v2 = JSON.parse(raw);
    if (!v2 || typeof v2 !== "object") return null;

    const assistantId = v2.activeModelGroupId || null;
    const modelId = v2.activeModelId || null;
    const chats = Array.isArray(v2.chats) ? v2.chats : [];

    // v2 chats did not carry assistant/model meta; attach current context.
    const migratedChats = chats.map((c) => {
      const cc = c && typeof c === "object" ? c : {};
      return {
        id: String(cc.id ?? ""),
        title: cc.title || "New chat",
        createdAt: typeof cc.createdAt === "number" ? cc.createdAt : nowTs(),
        lastAt:
          typeof cc.lastAt === "number"
            ? cc.lastAt
            : typeof cc.createdAt === "number"
              ? cc.createdAt
              : nowTs(),
        assistantId: cc.assistantId || assistantId,
        modelId: cc.modelId || modelId,
        messages: Array.isArray(cc.messages) ? cc.messages : [],
      };
    });

    return {
      assistantId,
      modelId,
      inputMode: "direct",
      chats: migratedChats,
      activeChatId: v2.activeChatId ?? null,
    };
  } catch {
    return null;
  }
}

function persistableState(state) {
  return {
    assistantId: state.assistantId,
    modelId: state.modelId,
    inputMode: state.inputMode,
    chats: state.chats,
    activeChatId: state.activeChatId,
    // prompt ui
    selectedPromptId: state.selectedPromptId,
    promptOptions: state.promptOptions,
  };
}

export const useChatStore = defineStore("chat", {
  state: () => ({
    // ✅ runtime init guard (so components can work without AppLayout parent)
    _initialized: false,

    assistantId: null,
    modelId: null,

    // ✅ input mode depends on assistant/model
    inputMode: "direct",

    chats: [],
    activeChatId: null,

    // current room messages & input
    messages: [],
    inputText: "",

    // ✅ prompt header (prompts by model_id)
    selectedPromptId: null,
    promptOptions: {},

    // UI locks (prevent navigation during streaming etc.)
    isLocked: false,
  }),

  getters: {
    /** assistant name (UI) */
    assistantLabel() {
      const ds = useDataStore();
      const found = (ds.uiAssistants || []).find(
        (a) => a.id === this.assistantId,
      );
      return found?.label || this.assistantId || "";
    },

    /** input modes available by assistant */
    availableInputModes() {
      // Spec Assistant: richer input modes
      const id = this.assistantId;
      if (id === "a3ab57b9-0d19-4347-b0ce-e6bdd896230c") {
        return [
          { id: "direct", label: "직접" },
          { id: "email", label: "메일" },
          { id: "translate", label: "번역" },
          { id: "summary", label: "요약" },
          { id: "code", label: "코드" },
        ];
      }
      // Default: keep it simple
      return [{ id: "direct", label: "직접" }];
    },

    /** chats filtered by current assistant+model (so switching selector changes list/content) */
    chatsForCurrentContext(state) {
      const aid = state.assistantId;
      const mid = state.modelId;
      return (state.chats || []).filter((c) => {
        if (!c) return false;
        if (aid && c.assistantId !== aid) return false;
        if (mid && c.modelId !== mid) return false;
        return true;
      });
    },

    /** 현재 assistant의 모델 목록 (UI용) */
    currentModels() {
      const ds = useDataStore();
      if (!this.assistantId) return [];

      return ds.modelsByAssistant(this.assistantId).map((m) => ({
        model_id: m[JSON_KEYS.MODEL_ID],
        name_ko: m.name_ko,
        name_en: m.name_en,
        default: m[JSON_KEYS.DEFAULT_YN] === true,
      }));
    },

    activeChat(state) {
      return state.chats.find((c) => c.id === state.activeChatId) || null;
    },

    activeChatTitle() {
      return this.activeChat?.title || "";
    },

    /** prompts for current model */
    currentPrompts() {
      const ds = useDataStore();
      if (!this.modelId) return [];
      return ds
        .promptsByModel(this.modelId)
        .filter((p) => p?.delYN !== true)
        .sort(
          (a, b) =>
            (a?.promptTemplateOrder ?? 0) - (b?.promptTemplateOrder ?? 0),
        );
    },

    currentPrompt() {
      if (!this.selectedPromptId) return null;
      return (
        this.currentPrompts.find(
          (p) => p?.[JSON_KEYS.PROMPT_ID] === this.selectedPromptId,
        ) || null
      );
    },
  },

  actions: {
    /**
     * ✅ Safe init for "standalone components".
     * - Idempotent.
     * - Any component may call this to make sure data defaults exist.
     */
    ensureInitialized() {
      if (this._initialized) return;
      this.ensureDefaults();
      this._initialized = true;
    },

    /** load persisted + ensure assistant/model defaults */
    ensureDefaults() {
      const ds = useDataStore();

      // 1) restore (v3) or migrate (v2)
      const migrated = migrateLegacyV2IfNeeded();
      const saved =
        migrated || safeParse(localStorage.getItem(LS_KEY) || "null", null);
      if (saved && typeof saved === "object") {
        this.assistantId = saved.assistantId ?? this.assistantId;
        this.modelId = saved.modelId ?? this.modelId;
        this.inputMode = saved.inputMode ?? this.inputMode;
        this.chats = Array.isArray(saved.chats) ? saved.chats : [];
        this.activeChatId = saved.activeChatId ?? this.activeChatId;
        this.selectedPromptId = saved.selectedPromptId ?? this.selectedPromptId;
        this.promptOptions =
          saved.promptOptions && typeof saved.promptOptions === "object"
            ? saved.promptOptions
            : {};
      }

      // 2) assistant default
      if (!this.assistantId) {
        const first = ds.uiAssistants?.[0];
        this.assistantId = first
          ? first.id
          : (ds.assistants?.[0]?.[JSON_KEYS.ASSISTANT_ID] ?? null);
      }

      // 3) model default: first default=true else first model
      if (!this.modelId && this.assistantId) {
        const models = ds.modelsByAssistant(this.assistantId);
        const first =
          models.find((m) => m?.[JSON_KEYS.DEFAULT_YN] === true) ||
          models[0] ||
          null;
        this.modelId = first ? first[JSON_KEYS.MODEL_ID] : null;
      }

      // 4) active chat restore messages
      if (this.activeChatId) {
        this._loadMessagesFromActiveChat();
      } else {
        this.messages = [];
      }

      // 4.5) input mode sanity
      this._syncInputModeDefault();

      // 5) prompt default
      this._syncPromptDefault();

      this._persist();
    },

    _syncInputModeDefault() {
      const modes = this.availableInputModes;
      const ok = modes.some((m) => m.id === this.inputMode);
      if (!ok) this.inputMode = modes[0]?.id || "direct";
    },

    _persist() {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(persistableState(this)));
      } catch {
        // ignore
      }
    },

    /** ensure selectedPromptId matches current model */
    _syncPromptDefault() {
      const list = this.currentPrompts;
      if (!list.length) {
        this.selectedPromptId = null;
        this.promptOptions = {};
        return;
      }

      const exists =
        this.selectedPromptId &&
        list.some((p) => p?.[JSON_KEYS.PROMPT_ID] === this.selectedPromptId);
      if (!exists) {
        const first = list.find((p) => p?.default === true) || list[0];
        this.selectedPromptId = first?.[JSON_KEYS.PROMPT_ID] ?? null;
        this.promptOptions = {};
      }
    },

    /** ensure messages are loaded from active chat */
    _loadMessagesFromActiveChat() {
      const chat = this.activeChat;
      const msgs = Array.isArray(chat?.messages) ? chat.messages : [];
      // ✅ guard: only user/ai roles
      this.messages = msgs
        .filter((m) => m && (m.role === "user" || m.role === "assistant"))
        .map((m) => ({ ...m }));
    },

    /** Assistant 선택 → 첫 모델 자동 선택 */
    selectAssistant(assistantId) {
      if (this.isLocked) return;

      const ds = useDataStore();
      this.assistantId = assistantId;

      const models = ds.modelsByAssistant(assistantId);
      const first =
        models.find((m) => m?.[JSON_KEYS.DEFAULT_YN] === true) ||
        models[0] ||
        null;
      this.modelId = first ? first[JSON_KEYS.MODEL_ID] : null;

      // input mode default per assistant
      this.inputMode = "direct";
      this._syncInputModeDefault();

      // prompt reset for new model
      this.selectedPromptId = null;
      this.promptOptions = {};

      // ✅ switch to most recent chat for this assistant/model, else draft
      const best = this._pickMostRecentChatId();
      this.activeChatId = best;
      if (best) this._loadMessagesFromActiveChat();
      else this.messages = [];

      this.inputText = "";

      this._syncPromptDefault();

      this._persist();
    },

    /** 모델 직접 선택 */
    setModel(modelId) {
      if (this.isLocked) return;
      this.modelId = modelId;

      // ✅ switch room by assistant/model
      const best = this._pickMostRecentChatId();
      this.activeChatId = best;
      if (best) this._loadMessagesFromActiveChat();
      else this.messages = [];

      this.selectedPromptId = null;
      this.promptOptions = {};
      this._syncPromptDefault();

      this._persist();
    },

    /** input mode 선택 (UI tabs) */
    setInputMode(modeId) {
      if (this.isLocked) return;
      this.inputMode = modeId || "direct";
      this._syncInputModeDefault();

      // ✅ optional: auto-pick a prompt that matches mode (Spec assistant)
      const kw = {
        email: ["메일", "email"],
        translate: ["번역", "translate"],
        summary: ["요약", "summ"],
        code: ["코드", "code"],
        direct: [],
      };
      const keys = kw[this.inputMode] || [];
      if (keys.length) {
        const found = (this.currentPrompts || []).find((p) => {
          const name = (
            p?.name_ko ||
            p?.promptTemplateName ||
            ""
          ).toLowerCase();
          return keys.some((k) => name.includes(String(k).toLowerCase()));
        });
        if (found) {
          this.selectedPromptId =
            found?.[JSON_KEYS.PROMPT_ID] ?? this.selectedPromptId;
          this.promptOptions = {};
        }
      }

      this._persist();
    },

    /** prompt 선택 (InputHeader) */
    selectPrompt(promptId) {
      if (this.isLocked) return;
      this.selectedPromptId = promptId;
      this.promptOptions = {};
      this._persist();
    },

    setPromptOption(key, value) {
      this.promptOptions = { ...this.promptOptions, [key]: value };
      this._persist();
    },

    setInputText(v) {
      this.inputText = v;
    },

    /** 새 채팅방 생성 + 라우팅은 Sidebar가 처리 */
    createChat(text) {
      if (this.isLocked) return null;

      const id = String(nowTs());
      const ts = nowTs();
      const chat = {
        id,
        title: "New chat",
        createdAt: ts,
        lastAt: ts,
        assistantId: this.assistantId,
        modelId: this.modelId,
        messages: [],
      };
      this.chats = [chat, ...this.chats];
      this.activeChatId = id;
      this.messages = [];
      this.inputText = text;

      this._persist();
      return id;
    },

    /** 채팅방 선택 → 메시지 로드 */
    selectChat(id) {
      if (this.isLocked) return;
      this.activeChatId = id;
      this._loadMessagesFromActiveChat();

      // sync assistant/model to chat meta
      const chat = this.activeChat;
      if (chat) {
        this.assistantId = chat.assistantId;
        this.modelId = chat.modelId;
        this._syncPromptDefault();
      }

      this._persist();
    },

    _pickMostRecentChatId() {
      const list = (this.chats || [])
        .filter(
          (c) =>
            c?.assistantId === this.assistantId && c?.modelId === this.modelId,
        )
        .sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0));
      return list?.[0]?.id ?? null;
    },

    /** 채팅방 삭제 */
    deleteChat(id) {
      if (this.isLocked) return;

      const idx = this.chats.findIndex((c) => c.id === id);
      if (idx < 0) return;

      const nextChats = [...this.chats];
      nextChats.splice(idx, 1);
      this.chats = nextChats;

      if (this.activeChatId === id) {
        const best = this._pickMostRecentChatId();
        this.activeChatId = best;
        if (best) this._loadMessagesFromActiveChat();
        else this.messages = [];
      }

      this._persist();
    },

    lock() {
      this.isLocked = true;
    },

    unlock() {
      this.isLocked = false;
    },

    /** example 클릭 시 input에 주입 */
    applyExampleText(text) {
      this.inputText = String(text ?? "");
    },

    /** send: user message append + dummy assistant reply */
    send() {
      if (this.isLocked) return;
      const text = String(this.inputText ?? "").trim();

      console.log("▶️ Sending message:", text);

      if (!text) return;

      console.log("▶️ Sending message:", this.messages);

      // ensure room
      if (!this.activeChatId) {
        this.createChat(text);
      }

      const prompt = this.currentPrompt;
      const promptName = prompt?.promptTemplateName || prompt?.name_ko || "";
      const opts = this.promptOptions || {};
      const optionLines = Object.keys(opts)
        .map((k) => `${k}: ${opts[k]}`)
        .join(", ");

      const finalText = promptName
        ? `${text}\n\n(${promptName}${optionLines ? " · " + optionLines : ""})`
        : text;

      const userMsg = { role: "user", text: finalText, ts: nowTs() };
      this.messages = [...this.messages, userMsg];

      // update room
      const title =
        this.activeChat?.title && this.activeChat.title !== "New chat"
          ? this.activeChat.title
          : text.length > 24
            ? text.slice(0, 24) + "…"
            : text;

      const updated = {
        ...this.activeChat,
        title,
        lastAt: nowTs(),
        assistantId: this.assistantId,
        modelId: this.modelId,
        messages: this.messages,
      };

      this.chats = this.chats.map((c) => (c.id === updated.id ? updated : c));

      // demo assistant response (replace with API later)
      const aiMsg = {
        role: "assistant",
        text: `✅ (샘플 응답)\n\n요청하신 내용: ${text}\n\n- 선택된 modelId: ${this.modelId}\n- 선택된 assistantId: ${this.assistantId}`,
        ts: nowTs() + 1,
      };
      this.messages = [...this.messages, aiMsg];

      const updated2 = {
        ...updated,
        messages: this.messages,
        lastAt: nowTs() + 2,
      };
      this.chats = this.chats.map((c) => (c.id === updated2.id ? updated2 : c));

      this.inputText = "";
      this._persist();
    },
  },
});
