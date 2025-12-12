<template>
  <div class="layout-root">
    <AppHeader @toggle-sidebar="toggleSidebar" />

    <div class="layout-main">
      <AppSidebar
        :isOpen="sidebarOpen"
        :isMobileOrTablet="!isDesktop"
        :activePage="activePage"
        @close="sidebarOpen = false"
        @navigate="handleNavigate"
      />

      <main class="layout-content">
        <div class="layout-content__inner">
          <ChatView v-if="activePage === 'chat'" />
          <PlaygroundView v-else-if="activePage === 'playground'" />
        </div>
      </main>
    </div>

    <AppFooter />
  </div>
</template>

<script>
import AppHeader from "./AppHeader.vue";
import AppSidebar from "./AppSidebar.vue";
import AppFooter from "./AppFooter.vue";
import ChatView from "@/views/ChatView.vue";
import PlaygroundView from "@/views/PlaygroundView.vue";
import { useResponsive } from "@/composables/useResponsive";

export default {
  name: "AppLayout",
  components: { AppHeader, AppSidebar, AppFooter, ChatView, PlaygroundView },
  setup() {
    const { isDesktop } = useResponsive();
    return { isDesktop };
  },
  data() {
    return {
      sidebarOpen: true,
      activePage: "chat"
    };
  },
  watch: {
    isDesktop: {
      immediate: true,
      handler(val) {
        if (val) {
          this.sidebarOpen = true;
        } else {
          this.sidebarOpen = false;
        }
      }
    }
  },
  methods: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    handleNavigate(page) {
      this.activePage = page;
      if (!this.isDesktop) {
        this.sidebarOpen = false;
      }
    }
  }
};
</script>

<style lang="scss">
@use "@/assets/styles/components/applayout.scss";
</style>
