<template>
  <div class="p">
    <!-- Assistant / Model (default: enabled) -->
    <div class="row" v-if="showAssistant">
      <div class="lbl">Assistant</div>
      <select class="sel" v-model="assistantId" :disabled="lockAssistantModel" @change="onAssistant">
        <option v-for="a in assistants" :key="a.id" :value="a.id">{{ a.label }}</option>
      </select>
    </div>

    <div class="row" v-if="showModel">
      <div class="lbl">Model</div>
      <select class="sel" v-model="modelId" :disabled="lockAssistantModel" @change="onModel">
        <option v-for="m in models" :key="m.model_id" :value="m.model_id">{{ m.name_ko || m.name_en }}</option>
      </select>
    </div>

    <!-- Chat selector: ONLY for ChatMessageList tab -->
    <div class="row" v-if="showChat">
      <div class="lbl">Chat</div>
      <select class="sel" v-model="activeChatId" @change="onChat">
        <option value="">(draft)</option>
        <option v-for="c in chatOptions" :key="c.id" :value="c.id">
          {{ c.title || c.id }}
        </option>
      </select>
    </div>

    <p class="hint">
      ✅ 이 패널의 selector는 <b>Preview sub-app</b>의 <b>chatStore action</b>을 호출합니다.<br />
      따라서 <b>Main / ChatMessageList / ChatInput</b>가 서로 독립적으로 mount되어도 같은 컨텍스트로 동작해야 합니다.
    </p>
  </div>
</template>

<script>
import { useDataStore } from "@/stores/dataStore";
import { JSON_KEYS } from "@/constants/jsonKeys";
import { patchPreviewStore } from "@/stores/previewBridge";

const LS_KEY = "ds_chat_state_v3";

function pickDefaultModel(ds, assistantId) {
  const list = ds.modelsByAssistant(assistantId) || [];
  const first = list.find((m) => m?.[JSON_KEYS.DEFAULT_YN] === true) || list[0] || null;
  return first ? first[JSON_KEYS.MODEL_ID] : "";
}

export default {
  name: "ChatContextPanel",
  props: {
    // main | input | messages
    variant: { type: String, default: "main" },
  },
  data() {
    return {
      assistantId: "",
      modelId: "",
      activeChatId: "",
    };
  },
  computed: {
    ds() {
      return useDataStore();
    },
    assistants() {
      return this.ds.uiAssistants || [];
    },

    showAssistant() {
      // for message list, show assistant/model but locked
      return true;
    },
    showModel() {
      return true;
    },
    showChat() {
      return this.variant === "messages";
    },
    lockAssistantModel() {
      return this.variant === "messages";
    },
    models() {
      if (!this.assistantId) return [];
      return (this.ds.modelsByAssistant(this.assistantId) || []).map((m) => ({
        model_id: m[JSON_KEYS.MODEL_ID],
        name_ko: m.name_ko,
        name_en: m.name_en,
        default: m[JSON_KEYS.DEFAULT_YN] === true,
      }));
    },
    chatOptions() {
      // ✅ Use persisted storage so selector reflects *real* chats.
      // This works because preview sub-app and panels share the same origin/localStorage.
      try {
        const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
        const list = Array.isArray(saved?.chats) ? saved.chats : [];
        return [...list]
          .filter((c) => c && typeof c === "object")
          .sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0))
          .map((c) => ({
            id: c.id,
            title: c.title,
            assistantId: c.assistantId,
            modelId: c.modelId,
          }));
      } catch {
        return [];
      }
    },
  },
  methods: {
    patch(partial) {
      patchPreviewStore({ chat: partial });
    },
    onAssistant() {
      if (this.lockAssistantModel) return;
      // patch assistant first; model will follow default
      this.patch({ assistantId: this.assistantId });
      const def = pickDefaultModel(this.ds, this.assistantId);
      this.modelId = def;
      if (def) this.patch({ modelId: def });

      // reset active chat (draft)
      this.activeChatId = "";
      if (this.showChat) this.patch({ activeChatId: "" });
    },
    onModel() {
      if (this.lockAssistantModel) return;
      this.patch({ modelId: this.modelId });
      this.activeChatId = "";
      if (this.showChat) this.patch({ activeChatId: "" });
    },
    onChat() {
      const id = this.activeChatId || null;
      this.patch({ activeChatId: id });

      // ✅ reflect assistant/model of the selected chat in UI (locked)
      const found = this.chatOptions.find((c) => c.id === id);
      if (found) {
        this.assistantId = found.assistantId || this.assistantId;
        this.modelId = found.modelId || this.modelId;
      }
    },
  },
  mounted() {
    // init from local data
    const first = this.assistants?.[0];
    this.assistantId = first?.id || "";
    this.modelId = this.assistantId ? pickDefaultModel(this.ds, this.assistantId) : "";

    // patch preview to match (assistant/model only)
    if (this.variant !== "messages") {
      if (this.assistantId) this.patch({ assistantId: this.assistantId });
      if (this.modelId) this.patch({ modelId: this.modelId });
    } else {
      // messages tab: default to most recent chat if exists
      const firstChat = this.chatOptions?.[0];
      if (firstChat?.id) {
        this.activeChatId = firstChat.id;
        this.assistantId = firstChat.assistantId || this.assistantId;
        this.modelId = firstChat.modelId || this.modelId;
        this.patch({ activeChatId: firstChat.id });
      } else {
        this.patch({ activeChatId: null });
      }
    }
  },
};
</script>

<style scoped>
.p { display:flex; flex-direction: column; gap: 10px; }
.row { display:flex; align-items:center; gap: 10px; }
.lbl { width: 70px; font-size: 12px; color: var(--muted); }
.sel {
  flex:1; height: 34px; border-radius: 10px; border: 1px solid var(--border);
  background: transparent; color: var(--text); padding: 0 10px;
}
.hint { margin: 0; font-size: 12px; color: var(--muted); line-height: 1.4; }
</style>
