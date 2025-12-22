<template>
  <aside class="sidebar" :class="{ open: open, collapsed: collapsed }">
    <div class="top-row">
      <!-- ✅ Desktop에서는 Sidebar에 햄버거(접기/펼치기), Mobile에서는 Header에 있으므로 Sidebar에선 닫기(X) -->
      <button
        v-if="!isMobile"
        type="button"
        class="hamburger"
        aria-label="Toggle sidebar"
        @click="$emit('toggle-collapse')"
      >
        ☰
      </button>

      <button
        v-else
        type="button"
        class="hamburger"
        aria-label="Close sidebar"
        @click="$emit('close')"
      >
        ✕
      </button>

      <strong v-if="!collapsed" class="label">DS Assistant</strong>
    </div>

    <!-- 상단 네비게이션 (Chat / Playground / Models) -->
    <nav class="nav" aria-label="Primary navigation">
      <router-link to="/chat" aria-label="Chat" class="nav-item">
        <span class="icon" aria-hidden="true">💬</span>
        <span class="text">Chat</span>
      </router-link>

      <router-link to="/playground" aria-label="Playground" class="nav-item">
        <span class="icon" aria-hidden="true">🧪</span>
        <span class="text">Playground</span>
      </router-link>

      <div class="nav-divider" aria-hidden="true" />

      <!-- Models -->
      <div
        class="nav-section"
        :class="{ collapsed: collapsed }"
        role="group"
        aria-label="Models"
      >
        <div v-if="!collapsed" class="nav-section-label">Models</div>

        <button
          v-for="g in modelGroups"
          :key="g.id"
          type="button"
          class="nav-item nav-btn"
          :class="{ active: safeStore.activeModelGroupId === g.id }"
          @click="setModelGroup(g.id)"
        >
          <span class="icon model-icon" aria-hidden="true">
            {{ iconForGroup(g.id) }}
          </span>
          <span class="text">{{ g.label }}</span>
        </button>
      </div>
    </nav>

    <template v-if="!collapsed">
      <!-- ✅ 채팅 리스트: 오늘/어제/MM-dd 그룹 -->
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
                aria-label="Delete chat"
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
import { MODEL_GROUPS, getDefaultModelId } from "@/constants/models";

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function formatMMDD(ts) {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}-${dd}`;
}

export default {
  name: "AppSidebar",

  props: {
    store: {
      type: Object,
      default: () => ({ chats: [], activeChatId: null, draft: true }),
    },
    open: Boolean,
    collapsed: Boolean,
    isMobile: Boolean,
  },

  computed: {
    safeStore() {
      const s = this.store && typeof this.store === "object" ? this.store : {};
      return {
        chats: Array.isArray(s.chats) ? s.chats : [],
        activeChatId: s.activeChatId ?? null,
        draft: s.draft ?? !s.activeChatId,
        activeModelGroupId:
          s.activeModelGroupId || MODEL_GROUPS?.[0]?.id || "ds",
        activeModelId:
          s.activeModelId ||
          getDefaultModelId(
            s.activeModelGroupId || MODEL_GROUPS?.[0]?.id || "ds"
          ),
      };
    },

    modelGroups() {
      return MODEL_GROUPS;
    },

    groupedChats() {
      const chats = (this.safeStore.chats || [])
        .map((c) => ({
          ...c,
          lastAt:
            typeof c.lastAt === "number"
              ? c.lastAt
              : typeof c.createdAt === "number"
              ? c.createdAt
              : 0,
        }))
        .sort((a, b) => b.lastAt - a.lastAt);

      if (!chats.length) return [];

      const toYMD = (ts) => {
        const d = new Date(ts);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(d.getDate()).padStart(2, "0")}`;
      };

      const toMMDD = (ts) => {
        const d = new Date(ts);
        return `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate()
        ).padStart(2, "0")}`;
      };

      const now = new Date();
      const todayYMD = toYMD(now.getTime());

      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yesterdayYMD = toYMD(y.getTime());

      const groups = [];
      const map = new Map();

      for (const c of chats) {
        const ymd = toYMD(c.lastAt);
        let label;

        if (ymd === todayYMD) {
          label = "오늘";
        } else if (ymd === yesterdayYMD) {
          label = "어제";
        } else {
          label = toMMDD(c.lastAt);
        }

        if (!map.has(label)) {
          map.set(label, { label, items: [] });
          groups.push(map.get(label));
        }
        map.get(label).items.push(c);
      }

      return groups;
    },
  },

  methods: {
    iconForGroup(id) {
      if (id === "ds") return "DS";
      if (id === "spec") return "SP";
      if (id === "ops") return "OP";
      return "M";
    },

    selectChat(id) {
      const s = { ...this.safeStore };
      s.activeChatId = id;
      s.draft = false;

      const chat = (s.chats || []).find((c) => c.id === id);
      if (chat) {
        if (chat.modelGroupId) s.activeModelGroupId = chat.modelGroupId;
        if (chat.modelId) s.activeModelId = chat.modelId;
      }

      // Vuex 모델 상태도 동기화
      if (chat?.modelGroupId) this.$store.dispatch("model/setGroup", chat.modelGroupId);
      if (chat?.modelId) this.$store.dispatch("model/setModel", chat.modelId);

      this.$emit("store:update", s);
      if (this.isMobile) this.$emit("close");
      if (this.$route.path !== "/chat") this.$router.push("/chat");
    },

    deleteChat(id) {
      const s = { ...this.safeStore };
      s.chats = (s.chats || []).filter((c) => c.id !== id);
      if (s.activeChatId === id) {
        s.activeChatId = null;
        s.draft = true;
      }
      this.$emit("store:update", s);
    },

    setModelGroup(groupId) {
      const s = { ...this.safeStore };

      // 새 대화 상태
      s.activeChatId = null;
      s.draft = true;

      // 모델 그룹/기본 모델
      s.activeModelGroupId = groupId;
      s.activeModelId = getDefaultModelId(groupId);

      // Vuex 모델 상태도 동기화
      this.$store.dispatch("model/setGroup", groupId);

      this.$emit("store:update", s);

      if (this.isMobile) this.$emit("close");
      if (this.$route.path !== "/chat") this.$router.push("/chat");
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
</style>
