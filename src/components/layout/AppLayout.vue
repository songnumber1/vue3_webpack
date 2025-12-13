<template>
  <div class="layout">
    <AppSidebar
      :store="store"
      :open="sidebarOpen"
      :collapsed="sidebarCollapsed"
      :is-mobile="isMobile"
      @close="sidebarOpen = false"
      @store:update="onStoreUpdate"
    />

    <div class="main">
      <AppHeader
        :theme="theme"
        :is-mobile="isMobile"
        @toggle-sidebar="onToggleSidebar"
        @theme-change="setTheme"
      />

      <main class="content">
        <router-view :store="store" @store:update="onStoreUpdate" />
      </main>

      <AppFooter />
    </div>

    <div
      v-if="isMobile && sidebarOpen"
      class="backdrop"
      @click="sidebarOpen = false"
    />
  </div>
</template>

<script>
import AppHeader from "./AppHeader.vue";
import AppSidebar from "./AppSidebar.vue";
import AppFooter from "./AppFooter.vue";
import { loadStore, saveStore } from "@/services/chatStore";

export default {
  name: "AppLayout",

  components: { AppHeader, AppSidebar, AppFooter },

  data() {
    return {
      store: { chats: [], activeChatId: null, draft: true },
      viewportWidth: window.innerWidth,
      sidebarOpen: false, // mobile offcanvas
      sidebarCollapsed: false, // desktop collapsed
      theme: "light",
    };
  },

  computed: {
    isMobile() {
      return this.viewportWidth <= 768;
    },
  },

  mounted() {
    // 항상 안전한 기본 store 보장
    const loaded = loadStore();
    this.store = loaded && typeof loaded === "object"
      ? { chats: Array.isArray(loaded.chats) ? loaded.chats : [], activeChatId: loaded.activeChatId ?? null, draft: loaded.draft ?? true }
      : { chats: [], activeChatId: null, draft: true };

    const t = localStorage.getItem("theme") || "light";
    this.setTheme(t);
    window.addEventListener("resize", this.onResize);

    // 초기 레이아웃 상태
    this.onResize();
  },

  beforeUnmount() {
    window.removeEventListener("resize", this.onResize);
  },

  methods: {
    onResize() {
      this.viewportWidth = window.innerWidth;

      // desktop: sidebar는 기본적으로 보이게
      if (!this.isMobile) {
        this.sidebarOpen = false;
      }
    },

    onToggleSidebar() {
      // mobile: offcanvas open/close
      if (this.isMobile) {
        this.sidebarOpen = !this.sidebarOpen;
        return;
      }
      // desktop: collapse/expand
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },

    setTheme(t) {
      this.theme = t;
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem("theme", t);
    },

    onStoreUpdate(newStore) {
      // child에서 prop store를 직접 mutate할 수도 있으니 방어적으로 normalize
      const s = newStore && typeof newStore === "object" ? newStore : {};
      this.store = {
        chats: Array.isArray(s.chats) ? s.chats : [],
        activeChatId: s.activeChatId ?? null,
        draft: s.draft ?? !s.activeChatId,
      };
      saveStore(this.store);
    },
  },
};
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
}
.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 40;
}
</style>
