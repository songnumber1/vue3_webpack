<template>
  <aside class="sidebar" :class="{ open: open, collapsed: collapsed }">
    <strong v-if="!collapsed" class="label">DS Assistant</strong>

    <!-- 아이콘 레일: collapsed 시에도 UI가 깨지지 않도록 네비게이션은 항상 유지 -->
    <nav class="nav">
      <router-link to="/chat" aria-label="Chat">
        <span class="icon">💬</span><span class="text">Chat</span>
      </router-link>
      <router-link to="/playground" aria-label="Playground">
        <span class="icon">🧪</span><span class="text">Playground</span>
      </router-link>
    </nav>

    <!-- collapsed 상태에서는 채팅 리스트를 숨기고, 아이콘만 보여줌 -->
    <template v-if="!collapsed">
      <hr />

      <button type="button" class="chat-new" @click="startNewChat">
        <span class="icon">➕</span><span class="text">새 대화</span>
      </button>

      <div class="chat-list">
        <div
          v-for="c in safeChats"
          :key="c.id"
          class="chat-item"
          :class="{ active: store.activeChatId === c.id }"
        >
          <button type="button" class="chat-title" @click="selectChat(c.id)">
            {{ c.title }}
          </button>
          <button type="button" class="chat-del" @click.stop="deleteChat(c.id)">🗑</button>
        </div>
      </div>
    </template>
  </aside>
</template>

<script>
export default {
  props: {
    store: { type: Object, required: true },
    open: Boolean,
    collapsed: Boolean,
    isMobile: Boolean,
  },

  computed: {
    safeChats() {
      return Array.isArray(this.store?.chats) ? this.store.chats : [];
    },
  },

  methods: {
    startNewChat() {
      this.store.activeChatId = null;
      this.store.draft = true;
      this.$emit("store:update", this.store);
      if (this.isMobile) this.$emit("close");
      // 새 대화 시작 시 채팅 화면으로
      if (this.$route.path !== "/chat") this.$router.push("/chat");
    },
    selectChat(id) {
      this.store.activeChatId = id;
      this.store.draft = false;
      this.$emit("store:update", this.store);
      if (this.isMobile) this.$emit("close");
      if (this.$route.path !== "/chat") this.$router.push("/chat");
    },
    deleteChat(id) {
      const chats = Array.isArray(this.store?.chats) ? this.store.chats : [];
      this.store.chats = chats.filter((c) => c.id !== id);

      // 삭제한 채팅이 active면 다음 채팅으로 이동
      if (this.store.activeChatId === id) {
        const next = this.store.chats[0];
        this.store.activeChatId = next ? next.id : null;
        this.store.draft = !this.store.activeChatId;
      }

      this.$emit("store:update", this.store);
    },
  },
};
</script>

<style scoped>
.chat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chat-title {
  flex: 1;
  background: none;
  border: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 10px;
}
.chat-title:hover {
  background: rgba(127, 127, 127, 0.15);
}
.chat-del {
  background: none;
  border: none;
  cursor: pointer;
}
</style>
