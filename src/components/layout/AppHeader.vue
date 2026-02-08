<template>
  <header class="header">
    <!-- ✅ SM일 때만 Header 좌측에 햄버거 -->
    <button
      v-if="isMobile"
      type="button"
      class="icon-btn"
      aria-label="Open sidebar"
      @click="openSidebar"
    >
      <AppIcon name="menu" />
    </button>

    <!-- ✅ WEB(Desktop) : Sidebar 전체 숨김/표시 토글 -->
    <button
      v-else
      type="button"
      class="icon-btn"
      :aria-label="sidebarHidden ? 'Show sidebar' : 'Hide sidebar'"
      @click="toggleSidebarHidden"
    >
      <AppIcon :name="sidebarHidden ? 'sidebar-show' : 'sidebar-hide'" />
    </button>

    <div class="brand">
      <!-- ✅ Mobile에서는 헤더가 좁아지므로 DS 로고는 숨김 (요청사항) -->
      <div v-if="!isMobile" class="logo" aria-hidden="true">DS</div>
      <strong class="title">DS Assistant</strong>
    </div>

    <!-- ✅ Right controls (assistant + theme) -->
    <div class="right">
      <!-- ✅ Sidebar가 화면에서 사라지면(Desktop hidden / Mobile drawer closed)
           Header 우측에 Assistant selector를 노출해서 항상 선택 가능하도록 유지 -->
      <div v-if="showAssistantSelector" class="assistant-select" aria-label="Assistant selector">
        <select class="assistant-native" :value="selectedAssistantId" @change="onAssistantChange">
          <option v-for="a in assistants" :key="a.id" :value="a.id">{{ a.label }}</option>
        </select>
        <AppIcon name="chevron-down" size="sm" muted class="assistant-caret" />
      </div>

      <!-- ✅ Theme: Desktop에서는 버튼, Mobile에서는 select로 압축 -->
      <div class="theme-control" aria-label="Theme selector">
        <div v-if="!isMobile" class="themes">
          <button
            v-for="t in $theme.THEMES"
            :key="t"
            class="theme-btn"
            :class="{ active: theme === t }"
            @click="setTheme(t)"
          >
            <span class="theme-dot" aria-hidden="true" />
            {{ t }}
          </button>
        </div>

        <div v-else class="theme-select">
          <select class="theme-native" :value="theme" @change="onThemeChange">
            <option v-for="t in $theme.THEMES" :key="t" :value="t">{{ t }}</option>
          </select>
          <AppIcon name="chevron-down" size="sm" muted class="theme-caret" />
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import AppIcon from "@/components/common/AppIcon.vue";
import { useUiStore } from "@/stores/uiStore";
import { useChatStore } from "@/stores/chatStore";
import { useDataStore } from "@/stores/dataStore";

export default {
  name: "AppHeader",

  components: { AppIcon },

  computed: {
    store() {
      return useUiStore();
    },

    chatStore() {
      return useChatStore();
    },

    dataStore() {
      return useDataStore();
    },

    theme() {
      return this.store.theme;
    },

    isMobile() {
      return this.store.isMobile;
    },

    sidebarHidden() {
      return this.store.sidebarHidden;
    },

    sidebarOpen() {
      return this.store.sidebarOpen;
    },

    showAssistantSelector() {
      // Desktop: sidebarHidden일 때
      // Mobile: drawer가 닫혀있을 때(= sidebar가 화면에 없음)
      const base = this.sidebarHidden || (this.isMobile && !this.sidebarOpen);
      return base && (this.assistants || []).length > 0;
    },

    assistants() {
      return this.dataStore.uiAssistants || [];
    },

    selectedAssistantId() {
      // header는 단독 렌더링될 수도 있으니 안전 init
      this.chatStore.ensureInitialized();
      return this.chatStore.assistantId;
    },
  },

  methods: {
    openSidebar() {
      this.store.openSidebar();
    },

    toggleSidebarHidden() {
      this.store.toggleSidebarHidden();
    },

    setTheme(t) {
      this.store.setTheme(t);
      this.$theme.setTheme(t);
    },

    onThemeChange(e) {
      const t = e?.target?.value;
      if (!t) return;
      this.setTheme(t);
    },

    onThemeChange(e) {
      const t = e?.target?.value;
      if (!t) return;
      this.setTheme(t);
    },

    onAssistantChange(e) {
      const id = e?.target?.value;
      if (!id) return;
      if (this.chatStore.isLocked) return;

      this.chatStore.selectAssistant(id);

      // Sidebar에서 선택했을 때와 동일하게: main으로 이동
      if (this.$route?.path !== "/main") {
        this.$router.push("/main");
      }
    },
  },
};
</script>

<style scoped>
.header {
  width: 100%;
  height: var(--header-height);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border-bottom: 1px solid var(--header-border, var(--border));
  background: var(--header-bg, var(--bg-surface));
  position: sticky;
  top: 0;
  z-index: 90;
  backdrop-filter: saturate(140%) blur(10px);
}

.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: linear-gradient(180deg, var(--bg-surface), var(--bg-elevated));
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, background 0.15s ease;
}

.icon-btn:hover {
  transform: translateY(-1px);
}

.icon-btn:active {
  transform: translateY(0);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.logo {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 12px;
  color: var(--accent-contrast);
  background: linear-gradient(135deg, var(--accent), var(--accent-2, var(--accent)));
  box-shadow: var(--shadow-sm);
}

.title {
  font-size: 14px;
  color: var(--text-primary);
  letter-spacing: 0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.right {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.theme-control {
  display: inline-flex;
  align-items: center;
}

.themes {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
}

.assistant-select {
  position: relative;
  display: inline-flex;
  align-items: center;
}

/* native select (keeps UI/UX minimal & consistent) */
.assistant-native {
  height: 34px;
  padding: 0 34px 0 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: linear-gradient(180deg, var(--bg-surface), var(--bg-elevated));
  box-shadow: var(--shadow-xs, none);
  color: var(--text-primary);
  font-size: 12px;
  appearance: none;
  cursor: pointer;
  max-width: min(44vw, 240px);
}

.assistant-native:focus {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 28%, transparent);
}

.assistant-caret {
  position: absolute;
  right: 10px;
  pointer-events: none;
}

/* Mobile theme select */
.theme-select {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.theme-native {
  height: 34px;
  padding: 0 34px 0 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: linear-gradient(180deg, var(--bg-surface), var(--bg-elevated));
  box-shadow: var(--shadow-xs, none);
  color: var(--text-primary);
  font-size: 12px;
  appearance: none;
  cursor: pointer;
  max-width: min(40vw, 160px);
}

.theme-native:focus {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 28%, transparent);
}

.theme-caret {
  position: absolute;
  right: 10px;
  pointer-events: none;
}

.theme-btn {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg-surface) 70%, transparent);
  color: var(--text-primary);
  cursor: pointer;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-xs, none);
  transition: transform 0.15s ease, background 0.15s ease;
}

.theme-btn:hover {
  transform: translateY(-1px);
}

.theme-btn.active {
  background: linear-gradient(135deg, var(--accent), var(--accent-2, var(--accent)));
  color: #fff;
  border-color: transparent;
}

.theme-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.6;
}

@media (max-width: 520px) {
  .themes {
    gap: 4px;
  }
  .theme-btn {
    padding: 6px 8px;
  }

  .right {
    gap: 8px;
  }

  .title {
    max-width: 34vw;
  }
}
</style>
