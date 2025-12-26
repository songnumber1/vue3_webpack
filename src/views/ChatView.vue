<template>
  <div class="chat-box">
    <div v-if="showRoomHeader" class="room-header">
      <strong class="room-title">{{ activeChatTitle }}</strong>
      <span class="room-sub"> {{ assistantLabel }} · {{ modelId }} </span>
    </div>

    <div class="messages" ref="messagesWrap">
      <!-- ✅ NewChatLanding: /main (draft) -->
      <NewChatLanding v-if="showLanding" @pick="applySuggestion" />

      <!-- ✅ Chat messages -->
      <ChatMessageList v-else ref="messageList" />
    </div>

    <div class="input-row">
      <InputHeader />
      <PromptTemplateForm />

      <div class="input-main">
        <textarea
          v-model="input"
          rows="2"
          placeholder="메시지를 입력하세요"
          @keydown="onKeydown"
        />
        <button type="button" class="send" :disabled="isLocked" @click="send">
          Send
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import NewChatLanding from "@/components/chat/NewChatLanding.vue";
import ChatMessageList from "@/components/chat/ChatMessageList.vue";
import InputHeader from "@/components/chat/InputHeader.vue";
import PromptTemplateForm from "@/components/chat/PromptTemplateForm.vue";
import { useChatStore } from "@/stores/chatStore";

export default {
  name: "ChatView",
  components: {
    NewChatLanding,
    ChatMessageList,
    InputHeader,
    PromptTemplateForm,
  },

  computed: {
    chat() {
      return useChatStore();
    },
    input: {
      get() {
        return this.chat.inputText;
      },
      set(v) {
        this.chat.setInputText(v);
      },
    },
    isLocked() {
      return this.chat.isLocked;
    },
    activeChatId() {
      return this.chat.activeChatId;
    },
    activeChatTitle() {
      return this.chat.activeChatTitle;
    },
    assistantLabel() {
      return this.chat.assistantId;
    },
    modelId() {
      return this.chat.modelId;
    },
    showLanding() {
      // ✅ landing route: /main (no active chat yet) or no room selected
      return this.$route.name === "main" || !this.activeChatId;
    },
    showRoomHeader() {
      return !this.showLanding && !!this.activeChatId;
    },
  },

  watch: {
    // auto scroll on message change
    "chat.messages": {
      handler() {
        this.$nextTick(() => this.scrollToBottom());
      },
      deep: true,
    },
  },

  mounted() {
    this.scrollToBottom();
  },

  methods: {
    applySuggestion(text) {
      this.chat.applyExampleText(text);
    },

    send() {
      if (this.isLocked) return;

      // ensure room route
      if (!this.activeChatId) {
        const id = this.chat.createChat(this.input);

        if (id) this.$router.push(`/chat/${id}`);
      }

      this.chat.send();
      this.$nextTick(() => this.scrollToBottom());
    },

    onKeydown(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.send();
      }
    },

    scrollToBottom() {
      const wrap = this.$refs.messagesWrap;
      if (!wrap) return;
      wrap.scrollTop = wrap.scrollHeight;
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
  justify-content: space-between;
  padding: 0 16px;
}

.room-title {
  font-weight: 800;
}

.room-sub {
  font-size: 12px;
  color: var(--muted);
}

.messages {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px;
}

.input-row {
  border-top: 1px solid var(--border);
  background: var(--bg);
  padding: 12px;
  display: grid;
  gap: 10px;
}

.input-main {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

textarea {
  flex: 1;
  min-height: 56px;
  max-height: 180px;
  resize: vertical;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text);
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;
}

.send {
  height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--accent);
  color: white;
  cursor: pointer;
}

.send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
