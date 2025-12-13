<template>
  <div class="layout">
    <AppSidebar
      :open="sidebarOpen"
      :is-mobile="isMobile"
      @close="sidebarOpen = false"
    />

    <div class="main">
      <AppHeader
        :is-mobile="isMobile"
        @toggle-sidebar="sidebarOpen = !sidebarOpen"
      />

      <main class="content">
        <ChatView />
      </main>

      <AppFooter />
    </div>

    <!-- backdrop for mobile sidebar -->
    <div
      v-if="isMobile && sidebarOpen"
      class="backdrop"
      @click="sidebarOpen = false"
    ></div>
  </div>
</template>

<script>
import AppHeader from "./AppHeader.vue";
import AppSidebar from "./AppSidebar.vue";
import AppFooter from "./AppFooter.vue";
import ChatView from "@/views/ChatView.vue";
import { useResponsive } from "@/composables/useResponsive";

export default {
  name: "AppLayout",

  data() {
    return {
      sidebarOpen: false,
    };
  },

  computed: {
    isMobile() {
      return this.$responsive.getState().bp === "sm";
    },
  },

  watch: {
    isMobile(v) {
      if (!v) this.sidebarOpen = false;
    },
  },
};
</script>

<style scoped lang="scss">
.layout {
  min-height: 100vh;
  display: flex;
  background: var(--bg);
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
  padding: var(--gap-2);
}
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 40;
}
</style>
