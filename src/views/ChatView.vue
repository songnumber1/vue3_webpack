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
      <!-- ✅ 새 대화 (Assistant 선택 or + New Chat) -->
      <NewChatLanding v-if="showLanding" />

      <!-- ✅ 실제 채팅 메시지 -->
      <ChatMessageList v-else-if="safeStore.activeChatId" ref="messageList" />
    </div>

    <!-- 입력 영역 -->
    <div class="input-row">
      <InputHeader class="input-header" />

      <div class="input-main">
        <textarea
          v-model="input"
          rows="2"
          placeholder="메시지를 입력하세요"
          @keydown="onKeydown"
        />
        <button type="button" @click="send">Send</button>
      </div>
    </div>
  </div>
</template>

<script>
import NewChatLanding from "@/components/chat/NewChatLanding.vue";
import ChatMessageList from "@/components/chat/ChatMessageList.vue";
import InputHeader from "@/components/chat/InputHeader.vue";
import {
  createChatFromFirstMessage,
  touchChatOnMessage,
} from "../storage/chatStore";

export default {
  name: "ChatView",

  components: {
    NewChatLanding,
    ChatMessageList,
    InputHeader,
  },

  computed: {
    safeStore() {
      return this.$store.getters["chat/safeStore"];
    },

    // ✅ 핵심 수정: activeChatId 기준
    showLanding() {
      return !this.safeStore.activeChatId;
    },

    showRoomHeader() {
      return !!this.safeStore.activeChatId;
    },

    activeChatTitle() {
      return this.$store.getters["chat/activeChatTitle"];
    },

    input: {
      get() {
        return this.$store.getters["input/text"];
      },
      set(v) {
        this.$store.dispatch("input/setText", v);
      },
    },

    currentModelGroupId() {
      return this.$store.state.model.groupId;
    },

    currentModelId() {
      return this.$store.state.model.modelId;
    },

    currentModelGroupLabel() {
      return this.$store.getters["model/groupLabel"];
    },
  },

  methods: {
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

      // ✅ 새 대화에서 첫 메시지 → 채팅 생성
      if (!s.activeChatId) {
        const chat = createChatFromFirstMessage(text);
        chat.modelGroupId = s.activeModelGroupId;
        chat.modelId = s.activeModelId;
        chat.messages = [];
        s.chats = [chat, ...(s.chats || [])];
        s.activeChatId = chat.id;
      }

      const chat = (s.chats || []).find((c) => c.id === s.activeChatId);
      if (chat) {
        const msg = { role: "user", text, ts: Date.now() };
        chat.messages.push(msg);
        touchChatOnMessage(chat, msg);
      }

      this.$store.dispatch("input/clear");
      this.$store.dispatch("chat/update", s);

      this.$nextTick(() => {
        const list = this.$refs.messageList;
        if (list?.scrollToBottom) list.scrollToBottom();
      });
    },
  },
};
</script>

<style scoped>
/* 기존 스타일 그대로 */
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
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid var(--border);
  background: var(--bg-surface);
}
.input-main {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}
textarea {
  flex: 1;
  resize: none;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text-primary);
  border-radius: 14px;
  padding: 10px 12px;
}
</style>
