<template>
  <div class="p">
    <ChatContextPanel variant="input" />
    <p class="hint">
      ✅ ChatInput은 Assistant/Model에 따라 <b>InputMode</b>가 바뀌고,
      mode에 따라 입력 폼이 바뀌어야 합니다.
    </p>
  </div>
</template>

<script>
import ChatContextPanel from "./ChatContextPanel.vue";

export default {
  name: "InputPanel",
  components: { ChatContextPanel },
};
</script>

<style scoped>
.p { display:flex; flex-direction: column; gap: 12px; }
.hint { margin: 0; font-size: 12px; color: var(--muted); line-height: 1.4; }
</style>
