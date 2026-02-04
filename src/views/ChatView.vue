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

    <ChatInputBox />
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

</style>
