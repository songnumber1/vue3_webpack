<template>
  <aside class="sidebar" :class="{ open: open }">
    <strong>DS Assistant</strong>

    <router-link to="/chat">💬 Chat</router-link>
    <router-link to="/playground">🧪 Playground</router-link>

    <hr />

    <button @click="startNewChat">➕ 새 대화</button>

    <div v-for="c in store.chats" :key="c.id" class="chat-item">
      <span @click="selectChat(c.id)">{{ c.title }}</span>
      <button @click.stop="deleteChat(c.id)">🗑</button>
    </div>
  </aside>
</template>

<script>
export default {
  props: {
    store: { type: Object, required: true },
    open: Boolean,
    isMobile: Boolean,
  },

  methods: {
    startNewChat() {
      this.store.activeChatId = null;
      this.store.draft = true;
      this.$emit("close");
    },
    selectChat(id) {
      this.store.activeChatId = id;
      this.store.draft = false;
      this.$emit("close");
    },
    deleteChat(id) {
      this.store.chats = this.store.chats.filter((c) => c.id !== id);
    },
  },
};
</script>
