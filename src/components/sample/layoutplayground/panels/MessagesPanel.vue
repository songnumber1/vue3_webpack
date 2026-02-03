
<template>
  <div class="p">
    <div class="row">
      <div class="lbl2">Active chat</div>
      <select class="sel" v-model="activeChatId" @change="apply">
        <option value="preview-chat-1">preview-chat-1</option>
        <option value="preview-chat-2">preview-chat-2</option>
      </select>
    </div>
    <p class="hint">ChatMessageList가 <b>chatStore</b>를 직접 읽어 렌더되는지 확인하세요.</p>
  </div>
</template>

<script>
import { patchPreviewStore } from "@/stores/previewBridge";
export default {
  data() {
    return { activeChatId: "preview-chat-1" };
  },
  methods: {
    apply() {
      patchPreviewStore({ chat: { activeChatId: this.activeChatId } });
    }
  },
  mounted() { this.apply(); }
};
</script>

<style scoped>
.p { display:flex; flex-direction: column; gap: 12px; }
.row { display:flex; align-items:center; gap: 10px; }
.lbl2 { width: 90px; font-size: 12px; color: var(--muted); }
.sel {
  flex:1; height: 34px; border-radius: 10px; border: 1px solid var(--border);
  background: transparent; color: var(--text); padding: 0 10px;
}
.hint { margin: 0; font-size: 12px; color: var(--muted); line-height: 1.4; }
</style>
