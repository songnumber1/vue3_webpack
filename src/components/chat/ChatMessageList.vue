<template>
  <div class="chat-message-list">
    <div
      v-for="(msg, index) in messages"
      :key="index"
      class="chat-message"
      :class="{
        'chat-message--user': msg.role === 'user',
        'chat-message--assistant': msg.role === 'assistant'
      }"
    >
      <div class="chat-message__avatar">
        <span v-if="msg.role === 'user'">👤</span>
        <span v-else>🤖</span>
      </div>
      <div class="chat-message__bubble">
        <div class="chat-message__role">
          {{ msg.role === 'user' ? 'You' : 'DS Assistant' }}
        </div>
        <div class="chat-message__content">
          {{ msg.content }}
        </div>
      </div>
    </div>

    <div v-if="typing" class="chat-message chat-message--assistant">
      <div class="chat-message__avatar">
        🤖
      </div>
      <div class="chat-message__bubble">
        <div class="chat-message__role">
          DS Assistant
        </div>
        <div class="chat-message__content chat-message__content--typing">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ChatMessageList",
  props: {
    messages: {
      type: Array,
      default: () => []
    },
    typing: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style lang="scss">
@use "@/assets/styles/components/chatmessagelist.scss";
</style>
