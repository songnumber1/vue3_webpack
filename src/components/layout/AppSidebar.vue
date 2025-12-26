<template>
  <aside
    class="sidebar"
    :class="{ open: sidebarOpen, collapsed: sidebarCollapsed }"
  >
    <div class="top-row">
      <button
        v-if="!isMobile"
        type="button"
        class="hamburger"
        aria-label="Toggle sidebar"
        @click="toggleCollapse"
      >
        ☰
      </button>

      <button
        v-else
        type="button"
        class="hamburger"
        aria-label="Close sidebar"
        @click="closeSidebar"
      >
        ✕
      </button>

      <strong v-if="!sidebarCollapsed" class="label">DS Assistant</strong>
    </div>

    <!-- 상단 네비게이션 -->
    <nav class="nav" aria-label="Primary navigation">
      <router-link to="/main" aria-label="Chat" class="nav-item">
        <span class="icon">💬</span>
        <span class="text">Chat</span>
      </router-link>

      <router-link to="/playground" aria-label="Playground" class="nav-item">
        <span class="icon">🧪</span>
        <span class="text">Playground</span>
      </router-link>

      <div class="nav-divider" aria-hidden="true" />

      <div
        class="nav-section"
        :class="{ collapsed: sidebarCollapsed }"
        role="group"
        aria-label="Assistant"
      >
        <!-- ✅ 기존 label 줄 + 버튼만 추가 -->
        <div v-if="!sidebarCollapsed" class="nav-section-head">
          <div class="nav-section-label">Assistant</div>

          <button
            v-if="canToggleAssistants"
            type="button"
            class="nav-more"
            @click="toggleAssistants"
          >
            {{ assistantsExpanded ? "축소" : "더보기" }}
          </button>
        </div>

        <!-- ❗ 기존 버튼 렌더 구조 그대로 -->
        <button
          v-for="g in displayedAssistants"
          :key="g.id"
          type="button"
          class="nav-item nav-btn"
          :class="{ active: safeStore.activeModelGroupId === g.id }"
          @click="setModelGroup(g.id)"
        >
          <span class="icon model-icon">
            {{ iconForGroup(g.id) }}
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

            <div
              v-for="c in g.items"
              :key="c.id"
              class="chat-item"
              :class="{ active: safeStore.activeChatId === c.id }"
            >
              <button
                type="button"
                class="chat-title"
                @click="selectChat(c.id)"
              >
                {{ c.title }}
              </button>
              <button
                type="button"
                class="chat-del"
                @click.stop="deleteChat(c.id)"
              >
                🗑
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
import { PINNED_ASSISTANT_IDS } from "@/constants/pinnedAssistants";
import { useUiStore } from "@/stores/uiStore";
import { useChatStore } from "@/stores/chatStore";
import { useDataStore } from "@/stores/dataStore";

export default {
  name: "AppSidebar",

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
  width: 280px;
  min-width: 280px;
  border-right: 1px solid var(--border);
  background: var(--bg-surface);
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  transition: width 0.2s ease, min-width 0.2s ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 76px;
  min-width: 76px;
  padding: 14px 10px;
}

.top-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hamburger {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  cursor: pointer;
}

.hamburger:hover {
  background: var(--bg-soft);
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
}

.nav-item:hover {
  background: var(--bg-soft);
  border-color: var(--border);
}

.nav-btn {
  text-align: left;
}

.nav-item.active {
  background: var(--bg-soft);
  border-color: var(--border);
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
  font-size: 11px;
  font-weight: 700;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2px 0;
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
  background: var(--bg-soft);
  border-color: var(--border);
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
  opacity: 0.8;
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
