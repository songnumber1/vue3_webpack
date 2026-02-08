<template>
  <div v-if="prompt" class="ptf">
    <div class="ptf-head">
      <strong class="ptf-title">{{
        prompt.promptTemplateName || prompt.name_ko
      }}</strong>
      <span class="ptf-sub">{{ prompt.desc_ko }}</span>
    </div>

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
  font-size: var(--opt-font);
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
  font-size: var(--opt-font);
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

.ptf-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: var(--opt-h);
  padding: 0 var(--opt-pad-x);
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
  font-size: var(--opt-font);
}

.ptf-note,
.ptf-empty {
  font-size: var(--opt-font);
  color: var(--muted);
}
</style>
