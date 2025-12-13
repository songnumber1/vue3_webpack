<template>
  <aside class="sidebar" :class="{ open: open, collapsed: collapsed }">
    <strong class="label">DS Assistant</strong>

    <router-link to="/chat"
      ><span class="icon">💬</span><span class="text">Chat</span></router-link
    >
    <router-link to="/playground"
      ><span class="icon">🧪</span
      ><span class="text">Playground</span></router-link
    >

    <hr />

    <button type="button" @click="startNewChat">
      <span class="icon">➕</span><span class="text">새 대화</span>
    </button>

    <div v-for="c in safeChats" :key="c.id" class="chat-item">
      <button type="button" class="chat-title" @click="selectChat(c.id)">
        {{ c.title }}
      </button>
      <button type="button" class="chat-del" @click.stop="deleteChat(c.id)">
        X
      </button>
    </div>
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
