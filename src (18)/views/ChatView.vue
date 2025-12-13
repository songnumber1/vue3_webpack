<template>
  <div class="chat-box">
    <!-- 메시지 영역 -->
    <div class="messages" ref="messages">
      <!-- ✅ ChatGPT처럼: 새 대화(draft)일 때는 '빈 상태' 전용 UI/UX를 보여주되,
           하단 입력창은 그대로 유지 -->
      <NewChatLanding
        v-if="isDraft"
        @pick="applySuggestion"
      />

      <template v-else>
        <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
          <div class="bubble" v-html="render(m.text)" />
        </div>
      </template>
    </div>

    <!-- 입력 영역 -->
    <div class="input-row">
      <textarea
        v-model="input"
        rows="2"
        placeholder="메시지를 입력하세요"
        @keydown="onKeydown"
      />
      <button type="button" @click="send">Send</button>
    </div>
  </div>
</template>

<script>
import { md } from "@/utils/markdown";
import { createChatFromFirstMessage } from "@/services/chatStore";
import NewChatLanding from "@/components/chat/NewChatLanding.vue";

export default {
  name: "ChatView",

  components: { NewChatLanding },

  props: {
    store: {
      type: Object,
      // route 전환/초기 렌더 타이밍에서 store가 잠깐 undefined가 될 수 있어 방어
      default: () => ({ chats: [], activeChatId: null, draft: true }),
    },
  },

  emits: ["store:update"],

  data() {
    return {
      input: "",
    };
  },

  computed: {
    safeStore() {
      const s = this.store && typeof this.store === "object" ? this.store : {};
      return {
        chats: Array.isArray(s.chats) ? s.chats : [],
        activeChatId: s.activeChatId ?? null,
        draft: s.draft ?? !s.activeChatId,
      };
    },

    isDraft() {
      return !this.safeStore.activeChatId;
    },

    activeChat() {
      return (
        this.safeStore.chats.find((c) => c.id === this.safeStore.activeChatId) ||
        null
      );
    },

    messages() {
      return this.activeChat?.messages || [];
    },
  },

  watch: {
    // 채팅 이력 클릭 등으로 activeChatId가 바뀌면 스크롤 보정
    "store.activeChatId"() {
      this.$nextTick(this.scrollToBottom);
    },
  },

  mounted() {
    this.$nextTick(this.scrollToBottom);
  },

  methods: {
    applySuggestion(text) {
      this.input = text || "";
      // textarea에 포커스(가능하면)
      this.$nextTick(() => {
        const ta = this.$el?.querySelector?.("textarea");
        if (ta && ta.focus) ta.focus();
      });
    },

    render(text) {
      return md.render(text || "");
    },

    onKeydown(e) {
      // IME(한글/일본어 등) 조합 중 Enter는 전송 금지
      if (e?.isComposing) return;

      // Shift+Enter는 줄바꿈 허용
      if (e.key === "Enter" && e.shiftKey) return;

      // Enter는 전송
      if (e.key === "Enter") {
        e.preventDefault();
        this.send();
      }
    },

    emitUpdate() {
      // 부모(AppLayout)에서 saveStore 수행
      this.$emit("store:update", this.store);
    },

    send() {
      const text = (this.input || "").trim();
      if (!text) return;

      // store가 비정상일 때도 크래시하지 않도록 normalize
      if (!this.store || typeof this.store !== "object") return;

      // 채팅 최초 생성
      if (!this.activeChat) {
        const chat = createChatFromFirstMessage(text);
        // 최신이 위로 오도록 unshift
        this.store.chats = Array.isArray(this.store.chats) ? this.store.chats : [];
        this.store.chats.unshift(chat);
        this.store.activeChatId = chat.id;
        this.store.draft = false;
      }

      // activeChat는 computed이므로 store에서 다시 찾아 push
      const idx = this.store.chats.findIndex((c) => c.id === this.store.activeChatId);
      if (idx >= 0) {
        const chat = this.store.chats[idx];
        chat.messages = Array.isArray(chat.messages) ? chat.messages : [];
        chat.messages.push({ role: "user", text });

        // 제목이 비어있으면 첫 질문으로 설정
        if (!chat.title || chat.title === "New Chat") {
          chat.title = text.slice(0, 24);
        }
      }

      this.input = "";
      this.emitUpdate();
      this.$nextTick(this.scrollToBottom);
    },

    scrollToBottom() {
      const el = this.$refs.messages;
      if (el) el.scrollTop = el.scrollHeight;
    },
  },
};
</script>
