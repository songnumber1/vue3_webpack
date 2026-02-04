<template>
  <div class="p">
    <div class="row">
      <div class="lbl">Assistant</div>
      <select class="sel" v-model="assistantId" @change="onAssistant">
        <option v-for="a in assistants" :key="a.id" :value="a.id">{{ a.label }}</option>
      </select>
    </div>

    <div class="row">
      <div class="lbl">Model</div>
      <select class="sel" v-model="modelId" @change="onModel">
        <option v-for="m in models" :key="m.model_id" :value="m.model_id">{{ m.name_ko || m.name_en }}</option>
      </select>
    </div>

    <div class="row">
      <div class="lbl">Input</div>
      <select class="sel" v-model="inputMode" @change="onMode">
        <option v-for="m in modes" :key="m.id" :value="m.id">{{ m.label }}</option>
      </select>
    </div>

    <div class="row">
      <div class="lbl">Chat</div>
      <select class="sel" v-model="activeChatId" @change="onChat">
        <option value="">(draft)</option>
        <option v-for="c in chatIds" :key="c" :value="c">{{ c }}</option>
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

function pickDefaultModel(ds, assistantId) {
  const list = ds.modelsByAssistant(assistantId) || [];
  const first = list.find((m) => m?.[JSON_KEYS.DEFAULT_YN] === true) || list[0] || null;
  return first ? first[JSON_KEYS.MODEL_ID] : "";
}

export default {
  name: "ChatContextPanel",
  data() {
    return {
      assistantId: "",
      modelId: "",
      inputMode: "direct",
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
    models() {
      if (!this.assistantId) return [];
      return (this.ds.modelsByAssistant(this.assistantId) || []).map((m) => ({
        model_id: m[JSON_KEYS.MODEL_ID],
        name_ko: m.name_ko,
        name_en: m.name_en,
        default: m[JSON_KEYS.DEFAULT_YN] === true,
      }));
    },
    modes() {
      // mirror chatStore.availableInputModes (simple heuristic)
      if (this.assistantId === "a3ab57b9-0d19-4347-b0ce-e6bdd896230c") {
        return [
          { id: "direct", label: "직접" },
          { id: "email", label: "메일" },
          { id: "translate", label: "번역" },
          { id: "summary", label: "요약" },
          { id: "code", label: "코드" },
        ];
      }
      return [{ id: "direct", label: "직접" }];
    },
    chatIds() {
      // previewSeed provides these demo rooms
      if (this.assistantId === "a3ab57b9-0d19-4347-b0ce-e6bdd896230c") {
        return ["preview-spec-1", "preview-spec-2"];
      }
      return ["preview-chat-1", "preview-chat-2"];
    },
  },
  methods: {
    patch(partial) {
      patchPreviewStore({ chat: partial });
    },
    onAssistant() {
      // patch assistant first; model will follow default
      this.patch({ assistantId: this.assistantId });
      const def = pickDefaultModel(this.ds, this.assistantId);
      this.modelId = def;
      if (def) this.patch({ modelId: def });

      this.inputMode = this.modes?.[0]?.id || "direct";
      this.patch({ inputMode: this.inputMode });

      this.activeChatId = "";
      this.patch({ activeChatId: "" });
    },
    onModel() {
      this.patch({ modelId: this.modelId });
      this.activeChatId = "";
      this.patch({ activeChatId: "" });
    },
    onMode() {
      this.patch({ inputMode: this.inputMode });
    },
    onChat() {
      this.patch({ activeChatId: this.activeChatId || null });
    },
  },
  mounted() {
    // init from local data
    const first = this.assistants?.[0];
    this.assistantId = first?.id || "";
    this.modelId = this.assistantId ? pickDefaultModel(this.ds, this.assistantId) : "";
    this.inputMode = this.modes?.[0]?.id || "direct";

    // patch preview to match
    if (this.assistantId) this.patch({ assistantId: this.assistantId });
    if (this.modelId) this.patch({ modelId: this.modelId });
    this.patch({ inputMode: this.inputMode });
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
