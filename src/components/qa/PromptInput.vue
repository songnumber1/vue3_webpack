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

<style lang="scss">
@use "@/assets/styles/components/promptinput.scss";
</style>
