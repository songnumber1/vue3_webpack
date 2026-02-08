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
              <button type="button" class="chat-main" @click="selectChat(c.id)">
                <div class="chat-title-row">
                  <div class="chat-title">{{ c.title }}</div>
                  <div class="chat-time">{{ formatChatTime(c.lastAt || c.createdAt) }}</div>
                </div>
                <div class="chat-snippet">{{ chatSnippet(c) }}</div>
              </button>
              <button type="button" class="chat-del" aria-label="Delete chat" @click.stop="deleteChat(c.id)">
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


    formatChatTime(ts) {
      if (!ts) return "";
      const d = new Date(ts);
      const now = new Date();
      const sameDay = d.toDateString() === now.toDateString();
      if (sameDay) {
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      // MM/DD
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${mm}/${dd}`;
    },

    chatSnippet(chat) {
      const msgs = Array.isArray(chat?.messages) ? chat.messages : [];
      if (!msgs.length) return "새 대화를 시작해보세요.";
      const last = msgs[msgs.length - 1];
      const text = String(last?.text ?? "").replace(/\s+/g, " ").trim();
      if (!text) return last?.role === "assistant" ? "응답이 도착했어요." : "메시지를 보냈어요.";
      return text.length > 60 ? text.slice(0, 60) + "…" : text;
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
  width: var(--icon-btn);
  height: var(--icon-btn);
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
  font-size: var(--text-md);
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
  font-size: var(--text-xs);
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
  gap: 14px;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
  flex: 1;
}

/* nicer scrollbars (webkit) */
.chat-list::-webkit-scrollbar {
  width: 10px;
}
.chat-list::-webkit-scrollbar-thumb {
  background: color-mix(in srgb, var(--text-muted) 20%, transparent);
  border-radius: 999px;
  border: 3px solid transparent;
  background-clip: padding-box;
}
.chat-list::-webkit-scrollbar-track {
  background: transparent;
}

.chat-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-group-title {
  display: inline-flex;
  align-self: flex-start;
  font-size: var(--text-xs);
  letter-spacing: 0.2px;
  color: var(--text-muted);
  padding: 6px 10px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg-elevated) 85%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
}

.chat-item {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--border) 75%, transparent);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--bg-surface) 92%, transparent),
    color-mix(in srgb, var(--bg-elevated) 92%, transparent)
  );
  box-shadow: var(--shadow-sm);
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}

.chat-item::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 999px;
  background: transparent;
}

.chat-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  border-color: color-mix(in srgb, var(--accent) 22%, var(--border));
}

.chat-item.active {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--accent) 10%, var(--bg-surface)),
    color-mix(in srgb, var(--accent) 6%, var(--bg-elevated))
  );
}

.chat-item.active::before {
  background: var(--accent);
}

.chat-main {
  flex: 1;
  min-width: 0;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 2px 2px 2px 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chat-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.chat-title {
  font-size: var(--text-sm);
  font-weight: 650;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-time {
  flex: none;
  font-size: var(--text-xs);
  color: var(--text-muted);
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg-elevated) 80%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
}

.chat-snippet {
  font-size: var(--text-xs);
  color: var(--text-muted);
  line-height: 1.35;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.chat-del {
  flex: none;
  align-self: center;
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  border-radius: 12px;
  padding: 8px;
  transition: opacity 0.12s ease, background 0.15s ease, transform 0.15s ease;
}

.chat-item:hover .chat-del,
.chat-item.active .chat-del {
  opacity: 0.95;
  pointer-events: auto;
}

.chat-del:hover {
  background: color-mix(in srgb, var(--danger) 10%, var(--bg-soft));
  transform: translateY(-1px);
}

.chat-empty {
  color: var(--text-muted);
  font-size: var(--text-xs);
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px dashed color-mix(in srgb, var(--border) 75%, transparent);
  background: color-mix(in srgb, var(--bg-elevated) 70%, transparent);
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
  font-size: var(--text-xs);
  padding: 4px 8px;
  cursor: pointer;
}

.nav-more:hover {
  background: var(--bg-soft);
  color: var(--text-primary);
}

:global(:root.bp-sm) .sb-item,
:global(:root.bp-sm) .nav-item,
:global(:root.bp-sm) .assistant-item{
  min-height: var(--icon-btn);
}
</style>
