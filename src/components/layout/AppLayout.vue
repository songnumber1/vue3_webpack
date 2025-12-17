<template>
  <div class="layout">
    <!-- DESKTOP: sidebar는 레이아웃(flow) 안에 배치 -->
    <AppSidebar
      v-if="!isMobile"
      :store="store"
      :open="true"
      :collapsed="sidebarCollapsed"
      :is-mobile="false"
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

    <!-- MOBILE: sidebar는 overlay(fixed)로 따로 렌더링해서 '빈 공간'이 생기지 않게 함 -->
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
import { loadStore, saveStore, normalizeStore } from "@/stores/chatStore";

export default {
  name: "AppLayout",

  components: { AppHeader, AppSidebar, AppFooter },

  data() {
    return {
      store: { chats: [], activeChatId: null, draft: true },
      sidebarOpen: false, // mobile offcanvas
      sidebarCollapsed: false, // desktop collapsed
      theme: "light",
    };
  },

  computed: {
    isMobile() {
      // single source of truth for responsive
      return this.$responsive?.isMobile?.() ?? (window.innerWidth < 768);
    },
  },

  mounted() {
    // 항상 안전한 기본 store 보장
    const loaded = loadStore();
    this.store = normalizeStore(loaded);

    // init theme from themeManager (already applies to DOM)
    this.theme = this.$theme?.getTheme?.() || localStorage.getItem("theme") || "light";

    // responsive plugin is reactive; resize listener는 responsiveManager가 관리
  },

  watch: {
    // breakpoint 변경 시 mobile overlay 상태 정리
    "$responsive.state.bp"() {
      if (!this.isMobile) this.sidebarOpen = false;
    },
  },

  methods: {
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
      if (this.$theme?.setTheme) this.$theme.setTheme(t);
      else {
        document.documentElement.setAttribute("data-theme", t);
        localStorage.setItem("theme", t);
      }
    },

    onStoreUpdate(newStore) {
      // child에서 prop store를 직접 mutate할 수도 있으니 방어적으로 normalize
      this.store = normalizeStore(newStore);
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
  /*
    Mobile에서 사이드바 바깥 영역 클릭으로 닫히게 하되,
    전체 화면이 회색으로 덮이는(backdrop dim) UX는 제거.
  */
  background: rgba(0, 0, 0, 0);
  z-index: 45;
  /* 사이드바 영역(260px)은 backdrop이 덮지 않게 하여 클릭 방해 버그 방지 */
  left: 0;
}

@media (max-width: 768px) {
  .backdrop {
    left: 260px;
  }
  .mobile-sidebar {
    z-index: 50;
  }
}

</style>
