<template>
  <div class="chat-box">
    <!-- 메시지 영역 -->
    <div class="messages" ref="messages">
      <div v-if="isDraft" class="muted">새 대화를 시작하세요.</div>

      <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
        <div class="bubble" v-html="render(m.text)" />
      </div>
    </div>

    <!-- 입력 영역 -->
    <div class="input-row">
      <textarea
        v-model="input"
        rows="2"
        placeholder="메시지를 입력하세요"
        @keydown.enter.exact.prevent="send"
        @keydown.enter.shift.stop
      />
      <button @click="send">Send</button>
    </div>
  </div>
</template>

<script>
import { md } from "@/utils/markdown";
import { createChatFromFirstMessage } from "@/services/chatStore";

export default {
  name: "ChatView",

  /**
   * App.vue 또는 AppLayout.vue 에서
   * provide('chatStore'), provide('updateChatStore') 되어 있어야 함
   */
  inject: {
    chatStore: {
      default: () => ({
        chats: [],
        activeChatId: null,
        draft: true,
      }),
    },
    updateChatStore: {
      default: () => () => {},
    },
  },

  data() {
    return {
      input: "",
    };
  },

  computed: {
    /** 항상 안전한 store 반환 */
    store() {
      return (
        this.chatStore || {
          chats: [],
          activeChatId: null,
          draft: true,
        }
      );
    },

    isDraft() {
      return !this.store.activeChatId;
    },

    activeChat() {
      if (!Array.isArray(this.store.chats)) return null;
      return (
        this.store.chats.find((c) => c.id === this.store.activeChatId) || null
      );
    },

    messages() {
      return this.activeChat?.messages || [];
    },
  },

  methods: {
    render(text) {
      return md.render(text || "");
    },

    send() {
      const text = (this.input || "").trim();
      if (!text) return;

      // 채팅 최초 생성
      if (!this.activeChat) {
        const chat = createChatFromFirstMessage(text);
        this.store.chats.unshift(chat);
        this.store.activeChatId = chat.id;
        this.store.draft = false;
      }

      this.activeChat.messages.push({
        role: "user",
        text,
      });

      this.input = "";
      this.updateChatStore(this.store);

      this.$nextTick(this.scrollToBottom);
    },

    scrollToBottom() {
      const el = this.$refs.messages;
      if (el) el.scrollTop = el.scrollHeight;
    },
  },
};
</script>
