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
          :class="{ active: safeStore.activeChatId === c.id }"
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
    // ✅ route 전환/초기 렌더 타이밍에서 store가 잠깐 undefined가 될 수 있어 방어적으로 default 제공
    store: {
      type: Object,
      default: () => ({ chats: [], activeChatId: null, draft: true }),
    },
    open: Boolean,
    collapsed: Boolean,
    isMobile: Boolean,
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
    safeChats() {
      return this.safeStore.chats;
    },
  },

  methods: {
    startNewChat() {
      // prop store를 직접 mutate 하되, undefined 방어
      const s = this.store && typeof this.store === "object" ? this.store : (this.store = {});
      s.chats = Array.isArray(s.chats) ? s.chats : [];
      s.activeChatId = null;
      s.draft = true;
      this.$emit("store:update", s);
      if (this.isMobile) this.$emit("close");
      // 새 대화 시작 시 채팅 화면으로
      if (this.$route.path !== "/chat") this.$router.push("/chat");
    },
    selectChat(id) {
      const s = this.store && typeof this.store === "object" ? this.store : (this.store = {});
      s.chats = Array.isArray(s.chats) ? s.chats : [];
      s.activeChatId = id;
      s.draft = false;
      this.$emit("store:update", s);
      if (this.isMobile) this.$emit("close");
      if (this.$route.path !== "/chat") this.$router.push("/chat");
    },
    deleteChat(id) {
      const s = this.store && typeof this.store === "object" ? this.store : (this.store = {});
      const chats = Array.isArray(s.chats) ? s.chats : [];
      s.chats = chats.filter((c) => c.id !== id);

      // 삭제한 채팅이 active면 다음 채팅으로 이동
      if (s.activeChatId === id) {
        const next = s.chats[0];
        s.activeChatId = next ? next.id : null;
        s.draft = !s.activeChatId;
      }

      this.$emit("store:update", s);
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
