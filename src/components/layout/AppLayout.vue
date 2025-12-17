<template>
  <div class="layout">
    <!-- ✅ Header는 전체 너비 -->
    <AppHeader :theme="theme" :is-mobile="isMobile" @theme-change="setTheme" />

    <!-- ✅ Header 아래에 Sidebar + Main -->
    <div class="body">
      <!-- DESKTOP: sidebar는 레이아웃(flow) 안에 배치 -->
      <AppSidebar
        v-if="!isMobile"
        :store="store"
        :open="true"
        :collapsed="sidebarCollapsed"
        :is-mobile="false"
        @toggle-collapse="onToggleSidebarCollapse"
        @store:update="onStoreUpdate"
      />

      <!-- MOBILE: sidebar overlay -->
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
        <!-- MOBILE: Sidebar를 열기 위한 플로팅 버튼 (Header에 두지 않음) -->
        <button
          v-if="isMobile && !sidebarOpen"
          type="button"
          class="mobile-open-btn"
          aria-label="Open sidebar"
          @click="sidebarOpen = true"
        >
          ☰
        </button>

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
    // responsive manager
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
      // desktop collapse toggle
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

.mobile-open-btn {
  position: fixed;
  left: 12px;
  top: 66px;
  z-index: 60;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
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
