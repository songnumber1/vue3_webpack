<template>
  <div class="chat-box">
    <div class="messages" ref="messages">
      <div v-if="isDraft" class="muted">새 대화를 시작하세요.</div>
      <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
        <div class="bubble" v-html="render(m.text)" />
      </div>
    </div>

    <div class="input-row">
      <textarea v-model="input" rows="2" @keydown.enter.exact.prevent="send" />
      <button @click="send">Send</button>
    </div>
  </div>
</template>

<script>
import { md } from "@/utils/markdown";
import { createChatFromFirstMessage } from "@/services/chatStore";

export default {
  inject: ["chatStore", "updateChatStore"],

  data() {
    return { input: "" };
  },

  computed: {
    store() {
      return this.chatStore;
    },
    isDraft() {
      return !this.store.activeChatId;
    },
    activeChat() {
      return this.store.chats.find((c) => c.id === this.store.activeChatId);
    },
    messages() {
      return this.activeChat?.messages || [];
    },
  },

  methods: {
    render(t) {
      return md.render(t || "");
    },
    send() {
      const text = this.input.trim();
      if (!text) return;

      if (!this.activeChat) {
        const chat = createChatFromFirstMessage(text);
        this.store.chats.unshift(chat);
        this.store.activeChatId = chat.id;
      }
      this.activeChat.messages.push({ role: "user", text });
      this.input = "";
      this.updateChatStore(this.store);
    },
  },
};
</script>
