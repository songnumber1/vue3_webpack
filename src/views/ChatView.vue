<template>
  <div class="chat-box">
    <!-- 메시지 영역 -->
    <div class="messages">
      <!-- 새 대화(draft) -->
      <NewChatLanding
        v-if="showLanding"
        :model-groups="modelGroups"
        :model-group-id="currentModelGroupId"
        :model-id="currentModelId"
        @model="setModel"
        @pick="applySuggestion"
      />

      <!-- 채팅 메시지 리스트 -->
      <ChatMessageList
        v-else
        ref="messageList"
        :messages="messages"
        :render="render"
      />
    </div>

    <!-- 입력 영역 (기존 그대로) -->
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
import { createChatFromFirstMessage } from "@/stores/chatStore";
import { MODEL_GROUPS, getDefaultModelId } from "@/constants/models";
import NewChatLanding from "@/components/chat/NewChatLanding.vue";
import ChatMessageList from "@/components/chat/ChatMessageList.vue";

export default {
  name: "ChatView",

  // 옵션 API에서 computed에서 재사용하기 위해 static처럼 보관
  modelGroupsConst: MODEL_GROUPS,

  components: {
    NewChatLanding,
    ChatMessageList,
  },

  props: {
    store: {
      type: Object,
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
        activeModelGroupId: s.activeModelGroupId || MODEL_GROUPS?.[0]?.id || "ds",
        activeModelId:
          s.activeModelId ||
          getDefaultModelId(s.activeModelGroupId || MODEL_GROUPS?.[0]?.id || "ds"),
      };
    },

    isDraft() {
      return !this.safeStore.activeChatId;
    },

    showLanding() {
      // ✅ 요청: 대화 이력을 선택해도(메시지가 없을 때) "무엇을 도와드릴까요?" + 모델 옵션이 노출되게
      if (this.isDraft) return true;
      return (this.messages || []).length === 0;
    },

    activeChat() {
      return (
        this.safeStore.chats.find(
          (c) => c.id === this.safeStore.activeChatId
        ) || null
      );
    },

    messages() {
      return this.activeChat?.messages || [];
    },

    modelGroups() {
      return this.$options.modelGroupsConst || [];
    },

    currentModelGroupId() {
      // activeChat이 있으면 chat별 설정 우선
      return (
        this.activeChat?.modelGroupId || this.safeStore.activeModelGroupId || ""
      );
    },

    currentModelId() {
      return this.activeChat?.modelId || this.safeStore.activeModelId || "";
    },
  },

  watch: {
    "store.activeChatId"() {
      this.$nextTick(this.scrollToBottom);
    },
  },

  mounted() {
    this.$nextTick(this.scrollToBottom);
  },

  methods: {
    setModelGroup(groupId) {
      if (!this.store || typeof this.store !== "object") return;
      this.store.activeModelGroupId = groupId;
      // activeChat이 있으면 chat에도 반영
      if (this.activeChat) this.activeChat.modelGroupId = groupId;
      this.emitUpdate();
    },

    setModel(modelId) {
      if (!this.store || typeof this.store !== "object") return;
      this.store.activeModelId = modelId;
      if (this.activeChat) this.activeChat.modelId = modelId;
      this.emitUpdate();
    },
    applySuggestion(text) {
      this.input = text || "";
      this.$nextTick(() => {
        const ta = this.$el?.querySelector?.("textarea");
        if (ta && ta.focus) ta.focus();
      });
    },

    render(text) {
      return md.render(text || "");
    },

    onKeydown(e) {
      if (e?.isComposing) return;
      if (e.key === "Enter" && e.shiftKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        this.send();
      }
    },

    emitUpdate() {
      this.$emit("store:update", this.store);
    },

    send() {
      const text = (this.input || "").trim();
      if (!text) return;
      if (!this.store || typeof this.store !== "object") return;

      // 최초 채팅 생성
      if (!this.activeChat) {
        const chat = createChatFromFirstMessage(text);
        // ✅ 새 채팅은 현재 선택된 모델 설정을 고정
        chat.modelGroupId = this.safeStore.activeModelGroupId;
        chat.modelId = this.safeStore.activeModelId;
        this.store.chats = Array.isArray(this.store.chats)
          ? this.store.chats
          : [];
        this.store.chats.unshift(chat);
        this.store.activeChatId = chat.id;
        this.store.draft = false;
      }

      const idx = this.store.chats.findIndex(
        (c) => c.id === this.store.activeChatId
      );

      if (idx >= 0) {
        const chat = this.store.chats[idx];
        chat.messages = Array.isArray(chat.messages) ? chat.messages : [];
        chat.messages.push({ role: "user", text });

        if (!chat.title || chat.title === "New Chat") {
          chat.title = text.slice(0, 24);
        }
      }

      this.input = "";
      this.emitUpdate();
      this.$nextTick(this.scrollToBottom);
    },

    scrollToBottom() {
      const el =
        this.$refs.messageList?.$el || this.$el?.querySelector?.(".messages");

      if (el) el.scrollTop = el.scrollHeight;
    },
  },
};
</script>
