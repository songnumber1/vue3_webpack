<template>
  <div class="p">
    <ChatContextPanel />
    <p class="hint">
      Main/ChatView는 Assistant + Model + InputMode 조합에 따라
      랜딩/메시지/입력 UI가 바뀌어야 합니다.
    </p>
  </div>
</template>

<script>
import ChatContextPanel from "./ChatContextPanel.vue";

export default {
  name: "MainPanel",
  components: { ChatContextPanel },
};
</script>

<style scoped>
.p { display:flex; flex-direction: column; gap: 12px; }
.hint { margin: 0; font-size: 12px; color: var(--muted); line-height: 1.4; }
</style>
