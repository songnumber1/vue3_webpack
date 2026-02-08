<template>
  <div v-if="prompt" class="ptf">
        <slot name="top" />
<div v-if="hasTemplate" class="ptf-body">
      <div
        v-for="(cfg, key) in prompt.promptTemplate"
        :key="key"
        class="ptf-section"
      >
        <div class="ptf-label">
          {{ cfg.ko || key }}
          <span class="ptf-label-en" v-if="cfg.en">({{ cfg.en }})</span>
        </div>

        <div class="ptf-options" v-if="cfg.type === 'radio'">
          <label v-for="c in cfg.content || []" :key="c.tag" class="ptf-option">
            <input
              type="radio"
              :name="key"
              :value="c.tag"
              :checked="chat.promptOptions?.[key] === c.tag"
              @change="onPick(key, c.tag)"
            />
            <span class="ptf-option-text">{{ c.ko || c.tag }}</span>
          </label>
        </div>

        <!-- fallback -->
        <div v-else class="ptf-note">지원하지 않는 타입: {{ cfg.type }}</div>
      </div>
    </div>

    <div v-else class="ptf-empty">추가 옵션이 없습니다.</div>
  </div>
</template>

<script>
import { useChatStore } from "@/stores/chatStore";

export default {
  name: "PromptTemplateForm",
  created() {
    this.chat.ensureInitialized();
  },
  computed: {
    chat() {
      return useChatStore();
    },
    prompt() {
      return this.chat.currentPrompt;
    },
    hasTemplate() {
      const t = this.prompt?.promptTemplate;
      return t && typeof t === "object" && Object.keys(t).length > 0;
    },
  },
  methods: {
    onPick(key, tag) {
      this.chat.setPromptOption(key, tag);
    },
  },
};
</script>

<style scoped>
.ptf {
  border: 1px solid var(--border);
  background: var(--bg-surface);
  border-radius: 14px;
  padding: 10px 12px;
  margin-bottom: 10px;
}

.ptf-head {
  display: grid;
  gap: 2px;
  margin-bottom: 10px;
}

.ptf-title {
  font-size: 13px;
  font-weight: 800;
}

.ptf-sub {
  font-size: 12px;
  color: var(--muted);
}

.ptf-body {
  display: grid;
  gap: 12px;
}

.ptf-section {
  display: grid;
  gap: 8px;
}

.ptf-label {
  font-size: 12px;
  font-weight: 700;
}

.ptf-label-en {
  font-weight: 500;
  color: var(--muted);
  margin-left: 6px;
}

.ptf-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* desktop/tablet: keep options in one row when possible */
@media (min-width: 600px) {
  .ptf-options {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: thin;
  }
  .ptf-option {
    white-space: nowrap;
    flex: 0 0 auto;
  }
}
.ptf-option {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  background: var(--bg);
  border-radius: 999px;
  cursor: pointer;
  user-select: none;
}

.ptf-option:hover {
  background: var(--bg-surface);
}

.ptf-option-text {
  font-size: 12px;
}

.ptf-note,
.ptf-empty {
  font-size: 12px;
  color: var(--muted);
}

.ptf-top {
  display: grid;
  gap: 10px;
  margin-bottom: 10px;
}

.ptf-email-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.ptf-email-in {
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0 12px;
  background: var(--bg);
  color: var(--text);
  outline: none;
}

.ptf-email-in:focus {
  border-color: var(--primary);
}

@media (max-width: 720px) {
  .ptf-email-row {
    grid-template-columns: 1fr;
  }
}

/*
  NOTE: The email fields are rendered via a slot from the parent.
  Scoped styles do NOT automatically apply to slotted content.
  Keep the slot spacing/inputs consistent using ::v-slotted selectors.
*/
::v-slotted(.ptf-top) {
  display: grid;
  gap: 10px;
  margin-bottom: 14px; /* give breathing room before Language/Style rows */
}

::v-slotted(.ptf-email-row) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

::v-slotted(.ptf-email-in) {
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 0 12px;
  background: var(--bg);
  color: var(--text);
  outline: none;
}

::v-slotted(.ptf-email-in:focus) {
  border-color: var(--primary);
}

@media (max-width: 720px) {
  ::v-slotted(.ptf-email-row) {
    grid-template-columns: 1fr;
  }
}



</style>
