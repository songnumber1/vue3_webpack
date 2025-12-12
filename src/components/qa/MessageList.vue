<template>
  <div class="message-list">
    <BaseMessageBubble
      v-for="(m, i) in messages"
      :key="i"
      :role="m.role"
    >
      {{ m.text }}
    </BaseMessageBubble>
  </div>
</template>

<script>
import BaseMessageBubble from "./BaseMessageBubble.vue";

export default {
  name: "MessageList",
  components: { BaseMessageBubble },
  props: {
    messages: { type: Array, default: () => [] }
  }
};
</script>

<style lang="scss">
@use "@/assets/styles/components/messagelist.scss";
</style>
