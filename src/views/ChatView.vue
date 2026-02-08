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

    <ChatInputBox ref="inputBox" />
  </div>
</template>

<script>
import NewChatLanding from "@/components/chat/NewChatLanding.vue";
import ChatMessageList from "@/components/chat/ChatMessageList.vue";
import ChatInputBox from "@/components/chat/ChatInputBox.vue";
import { useChatStore } from "@/stores/chatStore";

export default {
  name: "ChatView",
  components: {
    NewChatLanding,
    ChatMessageList,
    ChatInputBox,
  },

  created() {
    // ✅ standalone-safe (ChatView can be mounted without AppLayout)
    this.chat.ensureInitialized();
  },

  computed: {
    chat() {
      return useChatStore();
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
      return this.chat.assistantLabel;
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
      // ✅ move focus to active editor so Enter works immediately
      this.$nextTick(() => {
        const ib = this.$refs.inputBox;
        if (ib && typeof ib.focusActiveEditor === "function") {
          ib.focusActiveEditor();
        }
      });
    },

    // send/onKeydown handled by ChatInputBox

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
  height: 56px;
  border-bottom: 1px solid var(--header-border, var(--border));
  background: color-mix(in srgb, var(--bg-surface) 75%, transparent);
  backdrop-filter: blur(10px);
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
  padding: var(--chat-padding);
}

/* =========================
   Message bubbles (modern)
   ========================= */
:deep(.msg) {
  display: flex;
  margin: 10px 0;
}

:deep(.msg.user) {
  justify-content: flex-end;
}

:deep(.msg.assistant) {
  justify-content: flex-start;
}

:deep(.msg .bubble) {
  max-width: min(760px, 92%);
  border-radius: 16px;
  padding: 12px 14px;
  line-height: 1.5;
  font-size: 14px;
  box-shadow: var(--shadow-xs, none);
  border: 1px solid color-mix(in srgb, var(--border) 65%, transparent);
}

:deep(.msg.user .bubble) {
  background: linear-gradient(135deg, var(--accent), var(--accent-2, var(--accent)));
  color: var(--accent-contrast);
  border-color: transparent;
}

:deep(.msg.assistant .bubble) {
  background: color-mix(in srgb, var(--bg-elevated) 85%, transparent);
  color: var(--text-primary);
}

/* markdown content inside bubbles */
:deep(.bubble p) {
  margin: 0.35em 0;
}

:deep(.bubble pre) {
  background: var(--chat-code-bg);
  color: var(--chat-code-text);
  border-radius: 14px;
  padding: 12px;
  overflow: auto;
}


@media (max-width: 520px) {
  .messages {
    padding: 12px;
  }
  .room-header {
    padding: 0 12px;
  }
}
</style>
