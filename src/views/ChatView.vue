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
      />

      <!-- 채팅 메시지 리스트 -->
      <ChatMessageList
        v-else
        ref="messageList"
      />
    </div>

    <!-- 입력 영역 (기존 그대로) -->
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
import {
  createChatFromFirstMessage,
  touchChatOnMessage,
} from "@/storage/chatStore";
import { MODEL_GROUPS } from "@/constants/models";
import NewChatLanding from "@/components/chat/NewChatLanding.vue";
import ChatMessageList from "@/components/chat/ChatMessageList.vue";
import InputHeader from "@/components/chat/InputHeader.vue";

export default {
  name: "ChatView",

  modelGroupsConst: MODEL_GROUPS,

  components: {
    NewChatLanding,
    ChatMessageList,
    InputHeader,
  },

  data() {
    return {};
  },

  computed: {
    safeStore() {
      return this.$store.getters["chat/safeStore"];
    },

    showLanding() {
      return !!this.$store.getters["chat/isDraft"];
    },

    showRoomHeader() {
      // ✅ "이전 대화방 접속"일 때만: activeChatId 존재 + draft=false
      return !!this.safeStore.activeChatId && !this.$store.getters["chat/isDraft"];
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
      const g = (MODEL_GROUPS || []).find(
        (x) => x.id === this.currentModelGroupId
      );
      return g ? g.label : this.currentModelGroupId;
    },

  },

  methods: {
    // 모델 변경은 Landing에서 store로 직접 처리

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
        const msg = { role: "user", text, ts: Date.now() };
        chat.messages.push(msg);
        touchChatOnMessage(chat, msg);
      }

      this.$store.dispatch("input/clear");
      this.$store.dispatch("chat/update", s);

      this.$nextTick(() => {
        const list = this.$refs.messageList;
        if (list && typeof list.scrollToBottom === "function")
          list.scrollToBottom();
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
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border-top: 1px solid var(--border);
  background: var(--bg-surface);
}

.input-main{
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
  outline: none;
}

textarea:focus{
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent);
}
</style>
