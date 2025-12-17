<template>
  <aside class="sidebar" :class="{ open: open, collapsed: collapsed }">
    <strong v-if="!collapsed" class="label">DS Assistant</strong>

    <!-- 상단 네비게이션 (Chat / Playground / Models) -->
    <nav class="nav" aria-label="Primary navigation">
      <router-link to="/chat" aria-label="Chat" class="nav-item">
        <span class="icon" aria-hidden="true">💬</span><span class="text">Chat</span>
      </router-link>

      <router-link to="/playground" aria-label="Playground" class="nav-item">
        <span class="icon" aria-hidden="true">🧪</span><span class="text">Playground</span>
      </router-link>

      <div class="nav-divider" aria-hidden="true" />

      <!-- Models: Chat/Playground와 동일한 위치(네비게이션 영역)에서 row 단위로 표시 -->
      <div class="nav-section" :class="{ collapsed: collapsed }" role="group" aria-label="Models">
        <div v-if="!collapsed" class="nav-section-label">Models</div>

        <button
          v-for="g in modelGroups"
          :key="g.id"
          type="button"
          class="nav-item nav-btn"
          :class="{ active: safeStore.activeModelGroupId === g.id }"
          @click="setModelGroup(g.id)"
        >
          <span class="icon model-icon" aria-hidden="true">{{ iconForGroup(g.id) }}</span>
          <span class="text">{{ g.label }}</span>
        </button>
      </div>
    </nav>

    <!-- collapsed 상태에서는 채팅 리스트를 숨기고, 아이콘만 보여줌 -->
    <template v-if="!collapsed">
      <button type="button" class="chat-new" @click="startNewChat">
        <span class="icon" aria-hidden="true">➕</span><span class="text">새 대화</span>
      </button>

      <div class="chat-list" aria-label="Chat list">
        <div
          v-for="c in safeChats"
          :key="c.id"
          class="chat-item"
          :class="{ active: safeStore.activeChatId === c.id }"
        >
          <button type="button" class="chat-title" @click="selectChat(c.id)">
            {{ c.title }}
          </button>
          <button type="button" class="chat-del" aria-label="Delete chat" @click.stop="deleteChat(c.id)">
            🗑
          </button>
        </div>

        <div v-if="!safeChats.length" class="chat-empty">
          아직 대화가 없어요.
        </div>
      </div>
    </template>
  </aside>
</template>

<script>
import { MODEL_GROUPS, getDefaultModelId } from "@/constants/models";

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
        activeModelGroupId: s.activeModelGroupId || MODEL_GROUPS?.[0]?.id || "ds",
        activeModelId:
          s.activeModelId ||
          getDefaultModelId(s.activeModelGroupId || MODEL_GROUPS?.[0]?.id || "ds"),
      };
    },
    safeChats() {
      return this.safeStore.chats;
    },
    modelGroups() {
      return MODEL_GROUPS;
    },
  },

  methods: {
    iconForGroup(id) {
      if (id === "ds") return "DS";
      if (id === "spec") return "SP";
      if (id === "ops") return "OP";
      return "M";
    },

    startNewChat() {
      const s = { ...this.safeStore };
      s.activeChatId = null;
      s.draft = true;
      // 새 대화는 현재 선택된 모델 유지
      this.$emit("store:update", s);
      if (this.isMobile) this.$emit("close");
      if (this.$route.path !== "/chat") this.$router.push("/chat");
    },

    selectChat(id) {
      const s = { ...this.safeStore };
      s.activeChatId = id;
      s.draft = false;

      // 선택한 chat에 모델이 있으면 전역 선택도 그 값으로 맞춤 (UX 일관)
      const chat = (s.chats || []).find((c) => c.id === id);
      if (chat) {
        if (chat.modelGroupId) s.activeModelGroupId = chat.modelGroupId;
        if (chat.modelId) s.activeModelId = chat.modelId;
      }
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
      s.activeModelGroupId = groupId;
      s.activeModelId = getDefaultModelId(groupId);

      // draft/선택된 채팅에도 모델 반영 (현재 UX 유지)
      const chat = (s.chats || []).find((c) => c.id === s.activeChatId);
      if (chat) {
        chat.modelGroupId = groupId;
        chat.modelId = s.activeModelId;
      }

      this.$emit("store:update", s);

      // 모델 그룹 변경은 "Chat" 맥락이므로 Chat으로 이동
      if (this.isMobile) this.$emit("close");
      if (this.$route.path !== "/chat") this.$router.push("/chat");
    },
  },
};
</script>

<style scoped>
.sidebar{
  width: 280px;
  min-width: 280px;
  border-right: 1px solid var(--border);
  background: var(--bg-surface);
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  transition: width .2s ease, min-width .2s ease;
  overflow: hidden;
}

.sidebar.collapsed{
  width: 76px;
  min-width: 76px;
  padding: 14px 10px;
}

.label{
  font-size: 14px;
  color: var(--text-muted);
  letter-spacing: .2px;
}

.nav{
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-item{
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

.nav-item:hover{
  background: var(--bg-soft);
  border-color: var(--border);
}

.nav-btn{
  text-align: left;
}

.nav-item.active{
  background: var(--bg-soft);
  border-color: var(--border);
}

.nav-divider{
  height: 1px;
  background: var(--border);
  margin: 6px 6px;
  opacity: .7;
}

.nav-section{
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.nav-section-label{
  font-size: 12px;
  color: var(--text-muted);
  padding: 8px 10px 2px;
}

.icon{
  width: 22px;
  min-width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.model-icon{
  font-size: 11px;
  font-weight: 700;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 2px 0;
}

.text{
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar.collapsed .text{
  display: none;
}

.chat-new{
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-soft);
  color: var(--text-primary);
  cursor: pointer;
}

.chat-new:hover{
  filter: brightness(1.02);
}

.chat-list{
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow: auto;
  padding-right: 2px;
}

.chat-item{
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 8px;
  border-radius: 12px;
  border: 1px solid transparent;
}

.chat-item.active{
  background: var(--bg-soft);
  border-color: var(--border);
}

.chat-title{
  flex: 1;
  text-align: left;
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  font-size: 13px;
}

.chat-del{
  background: transparent;
  border: none;
  cursor: pointer;
  opacity: .8;
}

.chat-empty{
  color: var(--text-muted);
  font-size: 12px;
  padding: 8px 10px;
}
</style>
