<template>
  <form class="chat-input" @submit.prevent="handleSubmit">
    <BaseTextarea
      v-model="localValue"
      class="chat-input__textarea"
      rows="1"
      placeholder="메시지를 입력하고 Enter를 누르세요. (Shift+Enter 줄바꿈)"
      @keydown.enter.exact.prevent="handleSubmit"
      @keydown.enter.shift.exact.stop
      block
    />
    <BaseButton
      class="chat-input__send"
      type="submit"
      :disabled="!localValue.trim()"
      variant="primary"
    >
      ▲
    </BaseButton>
  </form>
</template>

<script>
import BaseTextarea from "@/components/common/BaseTextarea.vue";
import BaseButton from "@/components/common/BaseButton.vue";

export default {
  name: "ChatInput",
  components: { BaseTextarea, BaseButton },
  emits: ["submit"],
  data() {
    return {
      localValue: "",
    };
  },
  methods: {
    handleSubmit() {
      const v = this.localValue.trim();
      if (!v) return;
      this.$emit("submit", v);
      this.localValue = "";
    },
  },
};
</script>

<style lang="scss">
@use "@/assets/styles/chat/chatinput.scss";
</style>
