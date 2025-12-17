<template>
  <div class="layout">
    <!-- ✅ Header는 전체 너비 -->
    <AppHeader
      :theme="theme"
      :is-mobile="isMobile"
      @theme-change="setTheme"
      @open-sidebar="sidebarOpen = true"
    />

    <!-- ✅ Header 아래에 Sidebar + Main -->
    <div class="body">
      <!-- DESKTOP -->
      <AppSidebar
        v-if="!isMobile"
        :store="store"
        :open="true"
        :collapsed="sidebarCollapsed"
        :is-mobile="false"
        @toggle-collapse="onToggleSidebarCollapse"
        @store:update="onStoreUpdate"
      />

      <!-- MOBILE overlay -->
      <AppSidebar
        v-if="isMobile"
        class="mobile-sidebar"
        :store="store"
        :open="sidebarOpen"
        :collapsed="false"
        :is-mobile="true"
        @close="sidebarOpen = false"
        @store:update="onStoreUpdate"
      />

      <div class="main">
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
  </div>
</template>

<script>
import AppHeader from "./AppHeader.vue";
import AppSidebar from "./AppSidebar.vue";
import AppFooter from "./AppFooter.vue";
import { loadStore, saveStore, normalizeStore } from "@/stores/chatStore";

export default {
  name: "AppLayout",
  components: { AppHeader, AppSidebar, AppFooter },

  data() {
    return {
      store: { chats: [], activeChatId: null, draft: true },
      theme: "light",
      isMobile: false,
      sidebarOpen: false,
      sidebarCollapsed: false,
    };
  },

  created() {
    this.store = normalizeStore(loadStore());
    this.theme = this.$theme.getTheme();
  },

  mounted() {
    const update = () => {
      this.isMobile = this.$responsive.isSm();
      if (!this.isMobile) this.sidebarOpen = false;
    };
    update();
    window.addEventListener("resize", update);
    this._onResize = update;
  },

  beforeUnmount() {
    window.removeEventListener("resize", this._onResize);
  },

  methods: {
    onStoreUpdate(next) {
      this.store = normalizeStore(next);
      saveStore(this.store);
    },

    setTheme(t) {
      this.theme = t;
      this.$theme.setTheme(t);
    },

    onToggleSidebarCollapse() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
  },
};
</script>

<style scoped>
.layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.body {
  flex: 1;
  min-height: 0;
  display: flex;
  position: relative;
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

.mobile-sidebar {
  position: fixed;
  left: 0;
  top: 56px; /* header height */
  height: calc(100vh - 56px);
  z-index: 80;
}

.backdrop {
  position: fixed;
  inset: 56px 0 0 0; /* below header */
  background: rgba(0, 0, 0, 0.35);
  z-index: 70;
}
</style>
