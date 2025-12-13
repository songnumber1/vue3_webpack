<template>
  <div class="layout">
    <aside
      class="sidebar"
      :class="[
        { collapsed: !isMobile && collapsed },
        { open: isMobile && mobileOpen },
      ]"
    >
      <strong class="text">DS Assistant</strong>

      <div class="nav">
        <router-link to="/chat">💬 <span class="text">Chat</span></router-link>
        <router-link to="/playground"
          >🧪 <span class="text">Playground</span></router-link
        >
      </div>

      <div v-if="isChatRoute">
        <div class="label">채팅</div>
        <button class="chat-new" @click="startNewChat">
          ➕ <span class="text">새 대화</span>
        </button>

        <div class="label">이력</div>
        <div class="chat-list">
          <div
            v-for="c in chats"
            :key="c.id"
            class="chat-item-row"
            :class="{ active: c.id === activeChatId }"
          >
            <button
              class="chat-item-main"
              @click="selectChat(c.id)"
              :title="c.title"
            >
              📄
              <span class="text title" v-if="editingId !== c.id">{{
                c.title
              }}</span>
              <input
                v-else
                class="chat-title-input"
                v-model="editingTitle"
                @keydown.enter.prevent="saveTitle(c.id)"
                @keydown.esc.prevent="cancelEdit"
                @blur="saveTitle(c.id)"
              />
            </button>

            <div class="chat-item-actions" v-if="editingId !== c.id">
              <button class="icon-btn" @click.stop="startEdit(c)">✏️</button>
              <button class="icon-btn" @click.stop="deleteChat(c.id)">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style="margin-top: auto; font-size: 12px; color: var(--muted)">
        <span class="text">v13</span>
      </div>
    </aside>

    <div
      v-if="isMobile && mobileOpen"
      class="overlay"
      @click="mobileOpen = false"
    ></div>

    <div class="main">
      <header class="header">
        <button @click="toggleSidebar">☰</button>
        <strong>DS Assistant</strong>
        <div>
          <button
            class="theme-btn"
            :class="{ active: theme === 'light' }"
            @click="setTheme('light')"
          >
            Light
          </button>
          <button
            class="theme-btn"
            :class="{ active: theme === 'dim' }"
            @click="setTheme('dim')"
          >
            Dim
          </button>
          <button
            class="theme-btn"
            :class="{ active: theme === 'dark' }"
            @click="setTheme('dark')"
          >
            Dark
          </button>
        </div>
      </header>

      <router-view
        :store="store"
        @store:update="onStoreUpdate"
        @mobile:close="mobileOpen = false"
      />
    </div>
  </div>
</template>

<script>
import { loadStore, saveStore } from "./services/chatStore";

export default {
  data() {
    return {
      theme: "light",
      collapsed: false,
      mobileOpen: false,
      isMobile: window.innerWidth <= 768,
      store: loadStore(),
      editingId: null,
      editingTitle: "",
    };
  },
  computed: {
    chats() {
      return this.store.chats || [];
    },
    activeChatId() {
      return this.store.activeChatId;
    },
    isChatRoute() {
      return this.$route.path.startsWith("/chat");
    },
  },
  watch: {
    "$route.path"() {
      if (this.isMobile) this.mobileOpen = false;
    },
  },
  mounted() {
    const t = localStorage.getItem("theme") || "light";
    this.setTheme(t);
    window.addEventListener("resize", this.onResize);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.onResize);
  },
  methods: {
    onResize() {
      this.isMobile = window.innerWidth <= 768;
      if (this.isMobile) this.collapsed = false;
    },
    toggleSidebar() {
      if (this.isMobile) this.mobileOpen = !this.mobileOpen;
      else this.collapsed = !this.collapsed;
    },
    setTheme(t) {
      this.theme = t;
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem("theme", t);
    },
    persist() {
      saveStore(this.store);
    },
    onStoreUpdate(newStore) {
      this.store = newStore;
      this.persist();
    },

    startNewChat() {
      this.cancelEdit();
      this.store.activeChatId = null;
      this.store.draft = true;
      this.persist();
      if (this.isMobile) this.mobileOpen = false;
    },

    selectChat(id) {
      this.cancelEdit();
      this.store.activeChatId = id;
      this.store.draft = false;
      this.persist();
      if (this.isMobile) this.mobileOpen = false;
    },

    // title edit
    startEdit(chat) {
      this.editingId = chat.id;
      this.editingTitle = chat.title || "";
      this.$nextTick(() => {
        const el = document.querySelector(".chat-title-input");
        if (el) el.focus();
      });
    },
    cancelEdit() {
      this.editingId = null;
      this.editingTitle = "";
    },
    saveTitle(id) {
      if (this.editingId !== id) return;
      const title = (this.editingTitle || "").trim();
      const target = this.store.chats.find((c) => c.id === id);
      if (target) {
        target.title = title || target.title || "New Chat";
        this.persist();
      }
      this.cancelEdit();
    },

    // delete chat
    deleteChat(id) {
      if (!confirm("이 채팅을 삭제할까요?")) return;
      const idx = this.store.chats.findIndex((c) => c.id === id);
      if (idx >= 0) {
        this.store.chats.splice(idx, 1);
        if (this.store.activeChatId === id) {
          this.store.activeChatId = null;
          this.store.draft = true;
        }
        this.persist();
      }
      this.cancelEdit();
    },
  },
};
</script>
