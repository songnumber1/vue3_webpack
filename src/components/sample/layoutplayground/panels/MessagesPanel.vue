<template>
  <div class="p">
    <ChatContextPanel />
    <p class="hint">ChatMessageList는 <b>store.messages</b>를 렌더하므로, selector 변경 시 반드시 store.messages도 함께 바뀌어야 합니다.</p>
  </div>
</template>

<script>
import ChatContextPanel from "./ChatContextPanel.vue";

export default {
  name: "MessagesPanel",
  components: { ChatContextPanel },
};
</script>

<style scoped>
.p { display:flex; flex-direction: column; gap: 12px; }
.hint { margin: 0; font-size: 12px; color: var(--muted); line-height: 1.4; }
</style>
