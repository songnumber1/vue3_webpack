<template>
  <div class="chat-box">
    <!-- ✅ 이전 대화방 접속 시에만 채팅방 헤더 표시 -->
    <div v-if="showRoomHeader" class="room-header">
      <strong class="room-title">{{ activeChatTitle }}</strong>
      <span class="room-sub">
        {{ currentModelGroupLabel }} · {{ currentModelId }}
      </span>
    </div>

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
      const fallbackGroup = MODEL_GROUPS?.[0]?.id || "ds";
      const groupId = s.activeModelGroupId || fallbackGroup;

      return {
        chats: Array.isArray(s.chats) ? s.chats : [],
        activeChatId: s.activeChatId ?? null,
        draft: s.draft ?? !s.activeChatId,
        activeModelGroupId: groupId,
        activeModelId: s.activeModelId || getDefaultModelId(groupId),
      };
    },

    showLanding() {
      return !!this.safeStore.draft;
    },

    showRoomHeader() {
      // ✅ "이전 대화방 접속"일 때만: activeChatId 존재 + draft=false
      return !!this.safeStore.activeChatId && !this.safeStore.draft;
    },

    activeChatTitle() {
      const chat = (this.safeStore.chats || []).find(
        (c) => c.id === this.safeStore.activeChatId
      );
      return chat ? chat.title : "Chat";
    },

    messages() {
      if (this.showLanding) return [];
      const chat = (this.safeStore.chats || []).find(
        (c) => c.id === this.safeStore.activeChatId
      );
      return chat ? (Array.isArray(chat.messages) ? chat.messages : []) : [];
    },

    currentModelGroupId() {
      return this.safeStore.activeModelGroupId;
    },

    currentModelId() {
      return this.safeStore.activeModelId;
    },

    currentModelGroupLabel() {
      const g = (MODEL_GROUPS || []).find((x) => x.id === this.currentModelGroupId);
      return g ? g.label : this.currentModelGroupId;
    },

    modelGroups() {
      return MODEL_GROUPS;
    },
  },

  methods: {
    render(text) {
      return md.render(String(text ?? ""));
    },

    applySuggestion(text) {
      this.input = String(text ?? "");
      this.$nextTick(() => this.send());
    },

    setModel({ groupId, modelId }) {
      const s = { ...this.safeStore };
      s.activeModelGroupId = groupId;
      s.activeModelId = modelId;

      // 현재 채팅방이 있으면 그 채팅에도 모델 반영
      const chat = (s.chats || []).find((c) => c.id === s.activeChatId);
      if (chat) {
        chat.modelGroupId = groupId;
        chat.modelId = modelId;
      }

      this.$emit("store:update", s);
    },

    onKeydown(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
    },

    send() {
      const text = String(this.input ?? "").trim();
      if (!text) return;

      const s = { ...this.safeStore };

      // draft 상태(새 대화)에서 첫 메시지 입력이면 채팅방 생성
      if (s.draft) {
        const chat = createChatFromFirstMessage(text);
        chat.modelGroupId = s.activeModelGroupId;
        chat.modelId = s.activeModelId;
        chat.messages = [];
        s.chats = [chat, ...(s.chats || [])];
        s.activeChatId = chat.id;
        s.draft = false;
      }

      const chat = (s.chats || []).find((c) => c.id === s.activeChatId);
      if (chat) {
        if (!Array.isArray(chat.messages)) chat.messages = [];
        chat.messages.push({ role: "user", text });
      }

      this.input = "";
      this.$emit("store:update", s);

      this.$nextTick(() => {
        const list = this.$refs.messageList;
        if (list && typeof list.scrollToBottom === "function") list.scrollToBottom();
      });
    },
  },
};
</script>

<style scoped>
.chat-box {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.room-header {
  height: 52px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-surface);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
}

.room-title {
  font-size: 13px;
  color: var(--text-primary);
}

.room-sub {
  font-size: 12px;
  color: var(--text-muted);
  margin-left: auto;
}

.messages {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.input-row {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid var(--border);
  background: var(--bg-surface);
}

textarea {
  flex: 1;
  resize: none;
}
</style>
