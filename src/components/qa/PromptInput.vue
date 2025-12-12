<template>
  <div class="prompt-area">
    <textarea
      v-model="input"
      class="prompt-textarea"
      placeholder="메시지를 입력하세요..."
      @keydown.enter.exact.prevent="submit"
    ></textarea>
    <button class="send-btn" @click="submit">전송</button>
  </div>
</template>

<script>
export default {
  name: "PromptInput",
  emits: ["send"],
  data() {
    return { input: "" };
  },
  methods: {
    submit() {
      if (!this.input.trim()) return;
      this.$emit("send", this.input);
      this.input = "";
    }
  }
};
</script>

<style scoped lang="scss">
.prompt-area {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: var(--space-3);
  padding: var(--space-4);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
}

.prompt-textarea {
  min-height: 3rem;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  font-size: var(--control-font-size);
  resize: none;
}

.send-btn {
  padding: 0 var(--space-4);
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-md);
  border: none;
}
</style>
