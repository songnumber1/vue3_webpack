<template>
  <div class="chat-box">
    <div v-if="showRoomHeader" class="room-header">
      <div class="room-left">
        <strong class="room-title">{{ activeChatTitle }}</strong>
      </div>

      <div class="room-right">
        <span class="room-sub">{{ assistantLabel }} · {{ modelId }}</span>
        <button
          type="button"
          class="icon-btn"
          title="Search in chat"
          @click="toggleSearch"
        >
          <AppIcon name="search" size="lg" />
        </button>
      </div>
    </div>

    <ChatSearchBar
      v-if="showRoomHeader"
      ref="searchBar"
      :container-el="messagesWrapEl"
    />

    <div class="messages" ref="messagesWrap">
      <NewChatLanding v-if="showLanding" @pick="applySuggestion" />
      <ChatMessageList v-else ref="messageList" />
    </div>

    <ChatInputBox ref="inputBox" />
  </div>
</template>

<script>
import AppIcon from "@/components/common/AppIcon.vue";
import NewChatLanding from "@/components/chat/NewChatLanding.vue";
import ChatMessageList from "@/components/chat/ChatMessageList.vue";
import ChatInputBox from "@/components/chat/ChatInputBox.vue";
import ChatSearchBar from "@/components/chat/ChatSearchBar.vue";
import { useChatStore } from "@/stores/chatStore";

export default {
  name: "ChatView",
  components: {
    AppIcon,
    NewChatLanding,
    ChatMessageList,
    ChatInputBox,
    ChatSearchBar,
  },

  created() {
    this.chat.ensureInitialized();
  },

  data() {
    return {
      // ⚠️ Do NOT pass $refs directly as props in template.
      // $refs are not reactive; bind this once mounted.
      messagesWrapEl: null,
    };
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
      return this.$route.name === "main" || !this.activeChatId;
    },
    showRoomHeader() {
      return !this.showLanding && !!this.activeChatId;
    },
  },

  watch: {
    "chat.messages": {
      handler() {
        this.$nextTick(() => this.scrollToBottom());
      },
      deep: true,
    },
  },

  mounted() {
    this.scrollToBottom();
    this.messagesWrapEl = this.$refs.messagesWrap || null;
    window.addEventListener("keydown", this.onGlobalKeydown);
  },

  beforeUnmount() {
    window.removeEventListener("keydown", this.onGlobalKeydown);
  },

  methods: {
    applySuggestion(text) {
      this.chat.applyExampleText(text);
      this.$nextTick(() => {
        const ib = this.$refs.inputBox;
        if (ib && typeof ib.focusActiveEditor === "function") {
          ib.focusActiveEditor();
        }
      });
    },

    onGlobalKeydown(e) {
      if (!this.showRoomHeader) return;
      if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === "f") {
        e.preventDefault();
        this.openSearch();
      }
    },

    toggleSearch() {
      const bar = this.$refs.searchBar;
      if (!bar) return;
      if (bar.open) bar.close();
      else this.openSearch();
    },

    openSearch({ anchorMsgId = null, keyword = "" } = {}) {
      const bar = this.$refs.searchBar;
      if (!bar || typeof bar.openWith !== "function") return;
      bar.openWith({ anchorMsgId, keyword });
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
  height: 56px;
  border-bottom: 1px solid var(--header-border, var(--border));
  background: color-mix(in srgb, var(--bg-surface) 75%, transparent);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.room-left {
  min-width: 0;
}

.room-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.room-title {
  font-size: 14px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60vw;
}

.room-sub {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: var(--bg-surface);
}

.messages {
  flex: 1;
  overflow: auto;
  min-height: 0;
  padding: 16px 16px 12px;
}
</style>
