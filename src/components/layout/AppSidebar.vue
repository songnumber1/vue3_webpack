<template>
  <aside class="sidebar" :class="{ open: sidebarOpen, collapsed: sidebarCollapsed }">
    <div class="top-row">
      <button v-if="!isMobile" type="button" class="icon-btn" aria-label="Toggle sidebar" @click="toggleCollapse">
        <AppIcon :name="sidebarCollapsed ? 'panel-right' : 'panel-left'" />
      </button>

      <button v-else type="button" class="icon-btn" aria-label="Close sidebar" @click="closeSidebar">
        <AppIcon name="x" />
      </button>

      <strong v-if="!sidebarCollapsed" class="label">DS Assistant</strong>
    </div>

    <!-- 상단 네비게이션 -->
    <nav class="nav" aria-label="Primary navigation">
      <router-link to="/main" aria-label="Chat" class="nav-item">
        <span class="icon"><AppIcon name="chat" /></span>
        <span class="text">Chat</span>
      </router-link>

      <router-link to="/playground" aria-label="Playground" class="nav-item">
        <span class="icon"><AppIcon name="beaker" /></span>
        <span class="text">Playground</span>
      </router-link>

      <div class="nav-divider" aria-hidden="true" />

      <div class="nav-section" :class="{ collapsed: sidebarCollapsed }" role="group" aria-label="Assistant">
        <!-- ✅ 기존 label 줄 + 버튼만 추가 -->
        <div v-if="!sidebarCollapsed" class="nav-section-head">
          <div class="nav-section-label">Assistant</div>

          <button v-if="canToggleAssistants" type="button" class="nav-more" @click="toggleAssistants">
            <AppIcon :name="assistantsExpanded ? 'chevron-left' : 'chevron-right'" size="sm" muted />
            {{ assistantsExpanded ? "축소" : "더보기" }}
          </button>
        </div>

        <!-- ❗ 기존 버튼 렌더 구조 그대로 -->
        <button v-for="g in displayedAssistants" :key="g.id" type="button" class="nav-item nav-btn"
          :class="{ active: safeStore.activeModelGroupId === g.id }" @click="setModelGroup(g.id)">
          <span class="icon model-icon" aria-hidden="true">
            <AppIcon name="sparkles" size="sm" />
          </span>
          <span class="text">{{ g.label }}</span>
        </button>
      </div>
    </nav>

    <!-- ❗ 채팅 리스트: 절대 변경 없음 -->
    <template v-if="!sidebarCollapsed">
      <div class="chat-list" aria-label="Chat list">
        <template v-if="groupedChats.length">
          <div v-for="(g, gi) in groupedChats" :key="gi" class="chat-group">
            <div class="chat-group-title">{{ g.label }}</div>

            <div v-for="c in g.items" :key="c.id" class="chat-item"
              :class="{ active: safeStore.activeChatId === c.id }">
              <button type="button" class="chat-title" @click="selectChat(c.id)">
                {{ c.title }}
              </button>
              <button type="button" class="chat-del" @click.stop="deleteChat(c.id)">
                <AppIcon name="trash" size="sm" muted />
              </button>
            </div>
          </div>
        </template>

        <div v-else class="chat-empty">아직 대화가 없어요.</div>
      </div>
    </template>
  </aside>
</template>

<script>
import AppIcon from "@/components/common/AppIcon.vue";
import { PINNED_ASSISTANT_IDS } from "@/constants/pinnedAssistants";
import { useUiStore } from "@/stores/uiStore";
import { useChatStore } from "@/stores/chatStore";
import { useDataStore } from "@/stores/dataStore";

export default {
  name: "AppSidebar",

  components: { AppIcon },

  computed: {
    uiStore() {
      return useUiStore();
    },
    chatStore() {
      return useChatStore();
    },
    dataStore() {
      return useDataStore();
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
    assistantsExpanded() {
      return this.uiStore.assistantsExpanded;
    },

    chats() {
      // ✅ Sidebar chat list should NOT depend on assistant selection.
      // Show all chats so users can always access history.
      return this.chatStore.chats || [];
    },
    activeChatId() {
      return this.chatStore.activeChatId;
    },
    activeAssistantId() {
      return this.chatStore.assistantId;
    },

    assistants() {
      return this.dataStore.uiAssistants || [];
    },

    safeStore() {
      return {
        chats: Array.isArray(this.chats) ? this.chats : [],
        activeChatId: this.activeChatId ?? null,
        activeModelGroupId: this.activeAssistantId,
      };
    },

    modelGroups() {
      return (this.assistants || []).map((a) => ({
        id: a.id,
        label: a.label,
      }));
    },

    displayedAssistants() {
      if (this.assistantsExpanded) return this.modelGroups;
      const pinned = new Set(PINNED_ASSISTANT_IDS);
      return this.modelGroups.filter((a) => pinned.has(a.id));
    },

    canToggleAssistants() {
      return this.modelGroups.length > PINNED_ASSISTANT_IDS.length;
    },

    groupedChats() {
      const chats = [...this.safeStore.chats].sort(
        (a, b) => (b.lastAt || 0) - (a.lastAt || 0)
      );
      if (!chats.length) return [];

      const today = new Date().toDateString();
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yesterday = y.toDateString();
      const map = new Map();

      chats.forEach((c) => {
        const d = new Date(c.lastAt || c.createdAt);
        const label =
          d.toDateString() === today
            ? "오늘"
            : d.toDateString() === yesterday
              ? "어제"
              : `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
                d.getDate()
              ).padStart(2, "0")}`;

        if (!map.has(label)) map.set(label, []);
        map.get(label).push(c);
      });

      return [...map.entries()].map(([label, items]) => ({ label, items }));
    },
  },

  methods: {
    toggleAssistants() {
      this.uiStore.toggleAssistantsExpanded();
    },
    toggleCollapse() {
      this.uiStore.toggleCollapse();
    },
    closeSidebar() {
      this.uiStore.closeSidebar();
    },

    iconForGroup(id) {
      if (id === "5cf09b7e-af22-4895-b127-499ddfa907ef") return "DS";
      if (id === "a3ab57b9-0d19-4347-b0ce-e6bdd896230c") return "SP";
      if (id === "301bda52-09de-4ba3-a2b2-19c6e6e31c7b") return "OP";
      return "M";
    },

    /** ✅ assistant 선택은 여기서 트리거만 */
    setModelGroup(groupId) {
      if (this.chatStore.isLocked) return;

      this.chatStore.selectAssistant(groupId);

      if (this.$route.path !== "/main") {
        this.$router.push("/main");
      }
      if (this.isMobile) {
        this.closeSidebar();
      }
    },

    selectChat(id) {
      if (this.chatStore.isLocked) return;
      this.chatStore.selectChat(id);
      if (this.$route.name !== "chat") this.$router.push(`/chat/${id}`);
      if (this.isMobile) this.closeSidebar();
    },

    deleteChat(id) {
      if (this.chatStore.isLocked) return;
      this.chatStore.deleteChat(id);
    },
  },
};
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  border-right: 1px solid var(--sidebar-border, var(--border));
  background: var(--sidebar-bg, var(--bg-surface));
  background-image: var(--sidebar-bg-gradient, none);
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  transition: width 0.2s ease, min-width 0.2s ease;
  overflow: hidden;

  /* ensures internal scroll areas can size correctly */
  height: 100%;
  min-height: 0;
}

/* =========================
 * Mobile drawer behavior
 * - Vue applies the class on component root, so the <aside> becomes:
 *   class="sidebar mobile-sidebar open"
 * ========================= */
.sidebar.mobile-sidebar {
  width: min(84vw, 340px);
  min-width: min(84vw, 340px);
  border-right: 1px solid var(--sidebar-border, var(--border));
  background: var(--sidebar-bg-mobile, var(--sidebar-bg, var(--bg-surface)));
  background-image: none;
  backdrop-filter: none;

  transform: translateX(-105%);
  transition: transform 0.18s ease;
  box-shadow: var(--shadow-lg, 0 18px 50px rgba(0,0,0,0.18));
}

.sidebar.mobile-sidebar.open {
  transform: translateX(0);
}

.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
  min-width: var(--sidebar-collapsed-width);
  padding: 14px 10px;
}

.top-row {
  display: flex;
  align-items: center;
  gap: 10px;
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

.label {
  font-size: 14px;
  color: var(--text-muted);
  letter-spacing: 0.2px;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 10px;
  border-radius: 12px;
  text-decoration: none;
  border: 1px solid transparent;
  color: var(--text-primary);
  background: transparent;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.nav-item:hover {
  background: var(--sidebar-hover-bg, var(--bg-soft));
  border-color: color-mix(in srgb, var(--border) 70%, transparent);
  transform: translateY(-1px);
}

.nav-btn {
  text-align: left;
}

.nav-item.active {
  background: linear-gradient(135deg, var(--sidebar-active-bg, var(--bg-soft)), var(--sidebar-active-bg-2, var(--bg-elevated)));
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
  box-shadow: var(--shadow-xs, none);
}

.nav-divider {
  height: 1px;
  background: var(--border);
  margin: 6px 6px;
  opacity: 0.7;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-section-label {
  font-size: 12px;
  color: var(--text-muted);
  padding: 8px 10px 2px;
}

.icon {
  width: 22px;
  min-width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.model-icon {
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--bg-elevated) 85%, transparent);
  box-shadow: var(--shadow-xs, none);
}

.text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar.collapsed .text {
  display: none;
}

.chat-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow: auto;
  padding-right: 2px;
  flex: 1;
}

.chat-group-title {
  font-size: 12px;
  color: var(--text-muted);
  padding: 6px 10px 2px;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px;
  border-radius: 12px;
  border: 1px solid transparent;
}

.chat-item.active {
  background: var(--sidebar-active-bg, var(--bg-soft));
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
}

.chat-title {
  flex: 1;
  text-align: left;
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 13px;
}

.chat-del {
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0.9;
  border-radius: 10px;
  padding: 6px;
  transition: background 0.15s ease;
}

.chat-del:hover {
  background: var(--sidebar-hover-bg, var(--bg-soft));
}

.chat-empty {
  color: var(--text-muted);
  font-size: 12px;
  padding: 8px 10px;
}

.nav-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px 2px;
}

.nav-more {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  border-radius: 999px;
  font-size: 12px;
  padding: 4px 8px;
  cursor: pointer;
}

.nav-more:hover {
  background: var(--bg-soft);
  color: var(--text-primary);
}
</style>
