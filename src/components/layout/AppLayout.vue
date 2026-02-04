<template>
  <div class="layout">
    <!-- ✅ Header는 전체 너비 -->
    <AppHeader />

    <!-- ✅ Header 아래에 Sidebar + Main -->
    <div class="body">
      <!-- DESKTOP -->
      <AppSidebar
        v-if="!isMobile && !sidebarHidden"
        :class="{ collapsed: sidebarCollapsed }"
      />

      <!-- MOBILE overlay -->
      <AppSidebar
        v-if="isMobile"
        class="mobile-sidebar"
        :class="{ open: sidebarOpen }"
      />

      <div class="main">
        <main class="content">
          <router-view />
        </main>

        <AppFooter />
      </div>

      <div
        v-if="isMobile && sidebarOpen"
        class="backdrop"
        @click="closeSidebar"
      />
    </div>
  </div>
</template>

<script>
import AppHeader from "./AppHeader.vue";
import AppSidebar from "./AppSidebar.vue";
import AppFooter from "./AppFooter.vue";
import { useUiStore } from "@/stores/uiStore";
import { useChatStore } from "@/stores/chatStore";

export default {
  name: "AppLayout",

  components: { AppHeader, AppSidebar, AppFooter },

  created() {
    const ui = useUiStore();
    const chat = useChatStore();

    const t = this.$theme.getTheme();
    ui.initTheme(t);

    // ✅ allow AppLayout OR any standalone component to init chat state
    chat.ensureInitialized();
  },

  computed: {
    uiStore() {
      return useUiStore();
    },

    isMobile() {
      return this.uiStore.isMobile;
    },

    sidebarOpen() {
      return this.uiStore.sidebarOpen;
    },

    sidebarCollapsed() {
      return this.uiStore.sidebarCollapsed;
    },

    sidebarHidden() {
      return this.uiStore.sidebarHidden;
    },
  },

  mounted() {
    const update = () => {
      this.uiStore.setMobile(this.$responsive.isSm());
    };
    update();
    window.addEventListener("resize", update);
    this._onResize = update;
  },

  beforeUnmount() {
    window.removeEventListener("resize", this._onResize);
  },

  methods: {
    closeSidebar() {
      this.uiStore.closeSidebar();
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
  top: var(--header-height);
  height: calc(100vh - var(--header-height));
  z-index: 80;
}

.backdrop {
  position: fixed;
  inset: var(--header-height) 0 0 0; /* below header */
  background: rgba(0, 0, 0, 0.35);
  z-index: 70;
}
</style>
