<template>
  <div v-if="prompts.length" class="ih">
    <button
      v-for="p in prompts"
      :key="p.prompts_id"
      type="button"
      class="ih-btn"
      :class="{ active: selectedId === p.prompts_id }"
      @click="select(p.prompts_id)"
    >
      {{ p.name_ko }}
    </button>
  </div>

  <div v-else class="ih-empty">선택한 모델에 연결된 템플릿이 없습니다.</div>
</template>

<script>
import { useChatStore } from "@/stores/chatStore";

export default {
  name: "InputHeader",
  created() {
    // ✅ standalone-safe
    this.chat.ensureInitialized();
  },
  computed: {
    chat() {
      return useChatStore();
    },
    prompts() {
      return this.chat.currentPrompts || [];
    },
    selectedId() {
      return this.chat.selectedPromptId;
    },
  },
  methods: {
    select(id) {
      this.chat.selectPrompt(id);
    },
  },
};
</script>

<style scoped>
.ih {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ih-btn {
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
}

.ih-btn:hover {
  background: var(--bg-surface);
}

.ih-btn.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(100, 149, 237, 0.15);
  font-weight: 800;
}

.ih-empty {
  font-size: 12px;
  color: var(--muted);
  padding: 4px 0;
}
</style>
