<template>
  <div class="layout">
    <AppSidebar
      :open="sidebarOpen"
      :is-mobile="isMobile"
      @close="sidebarOpen = false"
    />

    <div class="main">
      <AppHeader :is-mobile="isMobile" @toggle-sidebar="toggleSidebar" />

      <main class="content">
        <slot />
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
      sidebarOpen: false,
      store: loadStore(),
    };
  },

  computed: {
    isMobile() {
      return this.$responsive.getState().bp === "sm";
    },
  },

  provide() {
    return {
      chatStore: this.store,
      updateChatStore: this.updateStore,
    };
  },

  watch: {
    isMobile(v) {
      if (!v) this.sidebarOpen = false;
    },
  },

  methods: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    updateStore(newStore) {
      this.store = newStore;
      saveStore(this.store);
    },
  },
};
</script>

<style scoped lang="scss">
.layout {
  display: flex;
  min-height: 100vh;
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
}
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 40;
}
</style>
