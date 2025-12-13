<template>
  <div class="layout">
    <AppSidebar
      :store="store"
      :open="sidebarOpen"
      :is-mobile="isMobile"
      @close="sidebarOpen = false"
    />

    <div class="main">
      <AppHeader
        :theme="theme"
        :is-mobile="isMobile"
        @toggle-sidebar="sidebarOpen = !sidebarOpen"
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
      store: loadStore(),
      sidebarOpen: false,
      theme: "light",
    };
  },

  computed: {
    isMobile() {
      return window.innerWidth <= 768;
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
      if (!this.isMobile) this.sidebarOpen = false;
    },

    setTheme(t) {
      this.theme = t;
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem("theme", t);
    },

    onStoreUpdate(newStore) {
      this.store = newStore;
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
