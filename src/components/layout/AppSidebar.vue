<template>
  <aside class="sidebar" :class="{ open: open, collapsed: collapsed }">
    <strong v-if="!collapsed" class="label">DS Assistant</strong>

    <!-- 아이콘 레일: collapsed 시에도 UI가 깨지지 않도록 네비게이션은 항상 유지 -->
    <nav class="nav">
      <router-link to="/chat" aria-label="Chat">
        <span class="icon">💬</span><span class="text">Chat</span>
      </router-link>
      <router-link to="/playground" aria-label="Playground">
        <span class="icon">🧪</span><span class="text">Playground</span>
      </router-link>
    </nav>

    <!-- collapsed 상태에서는 채팅 리스트를 숨기고, 아이콘만 보여줌 -->
    <template v-if="!collapsed">
      <hr />

      <!-- ✅ 모델 상위 그룹 (Chat / Playground 공통) -->
      <div class="model-groups" aria-label="Model groups">
        <div class="section-title">Models</div>
        <div class="group-list">
          <button
            v-for="g in modelGroups"
            :key="g.id"
            type="button"
            class="group-btn"
            :class="{ active: safeStore.activeModelGroupId === g.id }"
            @click="setModelGroup(g.id)"
          >
            {{ g.label }}
          </button>
        </div>
      </div>

      <button type="button" class="chat-new" @click="startNewChat">
        <span class="icon">➕</span><span class="text">새 대화</span>
      </button>

      <div class="chat-list">
        <div
          v-for="c in safeChats"
          :key="c.id"
          class="chat-item"
          :class="{ active: safeStore.activeChatId === c.id }"
        >
          <button type="button" class="chat-title" @click="selectChat(c.id)">
            {{ c.title }}
          </button>
          <button type="button" class="chat-del" @click.stop="deleteChat(c.id)">
            🗑
          </button>
        </div>
      </div>
    </template>
  </aside>
</template>

<script>
import { MODEL_GROUPS, getDefaultModelId } from "@/constants/models";

export default {
  props: {
    // ✅ route 전환/초기 렌더 타이밍에서 store가 잠깐 undefined가 될 수 있어 방어적으로 default 제공
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
    setModelGroup(groupId) {
      const s =
        this.store && typeof this.store === "object"
          ? this.store
          : (this.store = {});
      s.activeModelGroupId = groupId;
      s.activeModelId = getDefaultModelId(groupId);

      // chat이 선택되어 있으면 chat별 모델도 맞춰줌 (대화 이력 선택 시 landing 옵션이 일치)
      if (s.activeChatId) {
        const chat = (s.chats || []).find((c) => c.id === s.activeChatId);
        if (chat) {
          chat.modelGroupId = groupId;
          chat.modelId = s.activeModelId;
        }
      }

      this.$emit("store:update", s);
    },
    startNewChat() {
      // prop store를 직접 mutate 하되, undefined 방어
      const s =
        this.store && typeof this.store === "object"
          ? this.store
          : (this.store = {});
      s.chats = Array.isArray(s.chats) ? s.chats : [];
      s.activeChatId = null;
      s.draft = true;
      // 새 대화는 현재 모델 선택 유지
      s.activeModelGroupId =
        s.activeModelGroupId || MODEL_GROUPS?.[0]?.id || "ds";
      s.activeModelId =
        s.activeModelId || getDefaultModelId(s.activeModelGroupId);
      this.$emit("store:update", s);
      if (this.isMobile) this.$emit("close");
      // 새 대화 시작 시 채팅 화면으로
      if (this.$route.path !== "/chat") this.$router.push("/chat");
    },
    selectChat(id) {
      const s =
        this.store && typeof this.store === "object"
          ? this.store
          : (this.store = {});
      s.chats = Array.isArray(s.chats) ? s.chats : [];
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
      const s =
        this.store && typeof this.store === "object"
          ? this.store
          : (this.store = {});
      const chats = Array.isArray(s.chats) ? s.chats : [];
      s.chats = chats.filter((c) => c.id !== id);

      // 삭제한 채팅이 active면 다음 채팅으로 이동
      if (s.activeChatId === id) {
        const next = s.chats[0];
        s.activeChatId = next ? next.id : null;
        s.draft = !s.activeChatId;
      }

      this.$emit("store:update", s);
    },
  },
};
</script>

<style scoped>
.section-title{
  font-size: 12px;
  color: var(--text-muted);
  margin: 8px 0 6px;
}

.group-list{
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.group-btn{
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-primary);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}

.group-btn.active{
  background: var(--accent);
  color: #fff;
  border-color: transparent;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chat-title {
  font-size: 0.8rem;
  flex: 1;
  background: none;
  border: none;
  color: inherit;
  text-align: left;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 10px;
}
.chat-title:hover {
  background: rgba(127, 127, 127, 0.15);
}
.chat-del {
  background: none;
  border: none;
  cursor: pointer;
}
</style>
