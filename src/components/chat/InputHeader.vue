<template>
  <div v-if="prompts.length" class="ih" role="radiogroup" aria-label="Input mode">
    <label
      v-for="p in prompts"
      :key="p.prompts_id"
      class="ih-opt"
      :class="{ active: selectedId === p.prompts_id }"
    >
      <input
        class="ih-radio"
        type="radio"
        name="promptMode"
        :checked="selectedId === p.prompts_id"
        @change="select(p.prompts_id)"
      />
      <span class="ih-pill">
        <span class="ih-dot" aria-hidden="true" />
        <span class="ih-label">{{ labelFor(p) }}</span>
      </span>
    </label>
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
    isKo() {
      try {
        return String(navigator.language || "").toLowerCase().startsWith("ko");
      } catch {
        return true;
      }
    },
  },
  methods: {
    select(id) {
      this.chat.selectPrompt(id);
    },
    labelFor(p) {
      const ko = p?.name_ko || p?.promptTemplateName;
      const en = p?.name_en || ko;
      return this.isKo ? (ko || en) : (en || ko);
    },
  },
};
</script>

<style scoped>

.ih {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 2px 0;
}

.ih-opt {
  position: relative;
  cursor: pointer;
  user-select: none;
}

.ih-radio {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.ih-pill {
  min-height: var(--chip-h, var(--control-h));

  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: var(--pill-pad-y) var(--pill-pad-x);
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: color-mix(in srgb, var(--bg-surface) 60%, transparent);
  color: var(--text-primary);
  font-size: var(--pill-font);
  box-shadow: var(--shadow-xs, none);
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease, border-color 0.15s ease;
}

.ih-opt:hover .ih-pill {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.ih-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text-muted) 70%, transparent);
}

.ih-opt.active .ih-pill {
  background: linear-gradient(135deg, var(--accent), var(--accent-2, var(--accent)));
  border-color: transparent;
  color: var(--accent-contrast);
}

.ih-opt.active .ih-dot {
  background: rgba(255, 255, 255, 0.8);
}

.ih-empty {
  font-size: var(--pill-font);
  color: var(--muted);
  padding: 4px 0;
}

</style>
