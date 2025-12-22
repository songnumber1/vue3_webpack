<template>
  <div class="layout">
    <!-- ✅ Header는 전체 너비 -->
    <AppHeader />

    <!-- ✅ Header 아래에 Sidebar + Main -->
    <div class="body">
      <!-- DESKTOP -->
      <AppSidebar
        v-if="!isMobile"
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

export default {
  name: "AppLayout",
  components: { AppHeader, AppSidebar, AppFooter },

  data() {
    return {
      // UI 상태는 Vuex(ui 모듈)로 이동
    };
  },

  created() {
    const t = this.$theme.getTheme();
    this.$store.dispatch("ui/initTheme", t);

    // 초기 템플릿 선택 보정
    this.$store.dispatch("prompt/onModelChanged");
  },

  computed: {
    isMobile() {
      return this.$store.state.ui.isMobile;
    },
    sidebarOpen() {
      return this.$store.state.ui.sidebarOpen;
    },
    sidebarCollapsed() {
      return this.$store.state.ui.sidebarCollapsed;
    },
  },

  mounted() {
    const update = () => {
      this.$store.dispatch("ui/setMobile", this.$responsive.isSm());
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
      this.$store.dispatch("ui/closeSidebar");
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
