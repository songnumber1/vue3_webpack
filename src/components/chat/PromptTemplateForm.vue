<template>
  <div v-if="prompt" class="ptf">
    <slot name="top" />

    <div v-if="hasTemplate" class="ptf-body">
      <!-- language + style row -->
      <div class="ptf-row" v-if="lang || style">
        <div v-if="lang" class="ptf-section">
          <div class="ptf-label">{{ lang.ko || "언어" }}</div>
          <div class="ptf-options" :class="{ collapsed: isMobile && !expanded }">
            <label
              v-for="c in lang.content || []"
              :key="c.tag"
              class="ptf-option"
              :class="{ active: chat.promptOptions?.language === c.tag }"
            >
              <input
                type="radio"
                name="language"
                :value="c.tag"
                :checked="chat.promptOptions?.language === c.tag"
                @change="onPick('language', c.tag)"
              />
              <span class="ptf-option-text">{{ c.ko || c.tag }}</span>
            </label>
          </div>
        </div>

        <div v-if="style" class="ptf-section">
          <div class="ptf-label">{{ style.ko || "스타일" }}</div>
          <div class="ptf-options" :class="{ collapsed: isMobile && !expanded }">
            <label
              v-for="c in style.content || []"
              :key="c.tag"
              class="ptf-option"
              :class="{ active: chat.promptOptions?.style === c.tag }"
            >
              <input
                type="radio"
                name="style"
                :value="c.tag"
                :checked="chat.promptOptions?.style === c.tag"
                @change="onPick('style', c.tag)"
              />
              <span class="ptf-option-text">{{ c.ko || c.tag }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- length row -->
      <div v-if="length" class="ptf-section length-row">
        <div class="ptf-label">{{ length.ko || "길이" }}</div>
        <div class="ptf-options" :class="{ collapsed: isMobile && !expanded }">
          <label
            v-for="c in length.content || []"
            :key="c.tag"
            class="ptf-option"
            :class="{ active: chat.promptOptions?.length === c.tag }"
          >
            <input
              type="radio"
              name="length"
              :value="c.tag"
              :checked="chat.promptOptions?.length === c.tag"
              @change="onPick('length', c.tag)"
            />
            <span class="ptf-option-text">{{ c.ko || c.tag }}</span>
          </label>
        </div>
      </div>

      <!-- mobile toggle -->
      <button
        v-if="isMobile && canToggle"
        type="button"
        class="ptf-toggle"
        @click="expanded = !expanded"
      >
        {{ expanded ? "옵션 접기" : "옵션 더보기" }}
      </button>
    </div>

    <div v-else class="ptf-empty">추가 옵션이 없습니다.</div>
  </div>
</template>

<script>
import { useChatStore } from "@/stores/chatStore";

export default {
  name: "PromptTemplateForm",
  data() {
    return {
      expanded: false,
      isMobile: false,
    };
  },
  created() {
    this.chat.ensureInitialized();
  },
  mounted() {
    this.onResize();
    window.addEventListener("resize", this.onResize, { passive: true });
    // 모바일에서는 기본 접힘, 데스크톱에서는 항상 펼침
    if (!this.isMobile) this.expanded = true;
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.onResize);
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
    lang() {
      return this.prompt?.promptTemplate?.language || null;
    },
    style() {
      return this.prompt?.promptTemplate?.style || null;
    },
    length() {
      return this.prompt?.promptTemplate?.length || null;
    },
    canToggle() {
      // 옵션이 적으면 토글 UI가 오히려 거슬리므로, 모바일에서만 “충분히 옵션이 많을 때” 표시
      const count = (cfg) => (cfg?.content ? cfg.content.length : 0);
      return count(this.lang) + count(this.style) + count(this.length) >= 7;
    },
  },
  methods: {
    onPick(key, tag) {
      this.chat.setPromptOption(key, tag);
    },
    onResize() {
      this.isMobile = window.matchMedia
        ? window.matchMedia("(max-width: 720px)").matches
        : window.innerWidth <= 720;

      // 데스크톱으로 돌아가면 항상 펼친 상태 유지
      if (!this.isMobile) this.expanded = true;
    },
  },
};
</script>

<style scoped>
/* =========================================================
   Card
   ========================================================= */
.ptf {
  border: 1px solid var(--border);
  background: var(--bg-surface);
  border-radius: 14px;
  padding: 10px 12px;
  margin-bottom: 10px;
}

/* =========================================================
   Slot (메일 to/subject)
   - slot content lives in parent, so use ::v-slotted
   ========================================================= */
::v-slotted(.ptf-top) {
  margin-bottom: 12px;
}

::v-slotted(.ptf-email-row) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

::v-slotted(.ptf-email-in) {
  height: 35px;
  padding: 0 14px;

  border-radius: 999px;
  border: 1.5px solid var(--border);
  background: var(--bg);

  font-size: 13px;
  font-weight: 500;
  color: var(--text);

  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

::v-slotted(.ptf-email-in::placeholder) {
  color: var(--muted);
}

::v-slotted(.ptf-email-in:focus) {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.15);
}

@media (max-width: 720px) {
  ::v-slotted(.ptf-email-row) {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  ::v-slotted(.ptf-email-in) {
    height: 38px;
  }
}

/* =========================================================
   Body / layout
   ========================================================= */
.ptf-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ptf-row {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.ptf-section {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.ptf-label {
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

/* =========================================================
   Options: grid wrap (no horizontal scroll)
   ========================================================= */
.ptf-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(92px, max-content));
  gap: 8px;
  align-items: center;
}

.ptf-options.collapsed {
  max-height: 76px; /* 약 2줄 */
  overflow: hidden;
}

/* =========================================================
   Radio pill: clearer active state
   ========================================================= */
.ptf-option {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;

  padding: 6px 12px;
  border: 1.5px solid var(--border);
  border-radius: 999px;
  background: var(--bg);

  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.ptf-option input {
  display: none;
}

/* custom radio circle */
.ptf-option::before {
  content: "";
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 2px solid var(--border);
  box-sizing: border-box;
  background: transparent;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}

.ptf-option-text {
  font-size: 11.5px;
  font-weight: 600;
}

.ptf-option:hover {
  border-color: color-mix(in srgb, var(--primary) 35%, var(--border));
}

.ptf-option.active {
  border-color: var(--primary);
  background: color-mix(in srgb, var(--primary) 10%, var(--bg));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 15%, transparent);
}

.ptf-option.active::before {
  border-color: var(--primary);
  background: var(--primary);
  box-shadow: inset 0 0 0 3px var(--bg);
}

/* =========================================================
   Mobile toggle
   ========================================================= */
.ptf-toggle {
  align-self: flex-start;
  padding: 6px 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--primary);
  background: transparent;
  border: 0;
  cursor: pointer;
}

.ptf-empty {
  font-size: 12px;
  color: var(--muted);
}
</style>
