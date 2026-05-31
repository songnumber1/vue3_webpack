<template>
  <section
    class="empty-stage empty-stage--main main-empty-state"
    :class="{
      'empty-stage--mobile-main': isMobile,
      'main-empty-state--preview': preview,
    }"
  >
    <div class="empty-center main-empty-state__center">
      <img
        class="empty-assistant-logo main-empty-state__logo"
        :src="assistantIcon"
        :alt="assistantLabel"
      />
      <h1>{{ resolvedTitle }}</h1>
      <p v-if="subtitle" class="main-empty-state__subtitle">{{ subtitle }}</p>
      <div
        v-if="normalizedSuggestions.length"
        class="suggestion-row suggestion-row--between main-empty-state__suggestions"
      >
        <button
          v-for="item in normalizedSuggestions"
          :key="item.id || item.text"
          class="suggestion-chip"
          type="button"
          :title="item.title || item.prompt || item.text"
          :aria-disabled="disableInteractions ? 'true' : undefined"
          @click="handleSuggestionClick(item)"
        >
          <span v-if="item.icon" aria-hidden="true">{{ item.icon }}</span>
          <span class="suggestion-chip-text">{{ item.text }}</span>
        </button>
      </div>
      <slot name="composer"></slot>
    </div>
  </section>
</template>

<script setup>
/**
 * @file components/workspace/MainEmptyState.vue
 * @description 메인 화면의 빈 상태 UI를 실제 메인 화면과 Studio 미리보기에서 함께 사용하는 공통 컴포넌트입니다.
 * 실제 입력/전송 기능은 slot으로만 주입하여 Studio 미리보기에서 채팅 요청이 발생하지 않도록 분리합니다.
 */
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {DEFAULT_ASSISTANT_IMAGE} from "@/constants/assistantImages";

const {t} = useI18n();

const props = defineProps({
  isMobile: {type: Boolean, default: false},
  preview: {type: Boolean, default: false},
  disableInteractions: {type: Boolean, default: false},
  assistantIcon: {
    type: String,
    default: DEFAULT_ASSISTANT_IMAGE.Image48Src,
  },
  assistantLabel: {type: String, default: "Assistant"},
  title: {type: String, default: ""},
  subtitle: {type: String, default: ""},
  suggestions: {type: Array, default: () => []},
});

const emit = defineEmits(["suggestion-click"]);

const resolvedTitle = computed(() => props.title || t("chat.startQuestion"));
const normalizedSuggestions = computed(() =>
  (props.suggestions || [])
    .filter(Boolean)
    .map((item, index) => {
      if (typeof item === "string") {
        return {
          id: `suggestion-${index}-${item}`,
          text: item,
          title: item,
          prompt: item,
        };
      }
      const text = item.text || item.title || item.prompt || "";
      return {
        ...item,
        id: item.id || `suggestion-${index}-${text}`,
        text,
        title: item.title || text,
        prompt: item.prompt || text,
      };
    })
    .filter((item) => item.text)
);

function handleSuggestionClick(item) {
  if (props.disableInteractions) return;
  emit("suggestion-click", item);
}
</script>

<style scoped lang="scss">
.main-empty-state--preview {
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  background:
    radial-gradient(
      circle at 50% 0%,
      color-mix(in srgb, var(--studio-primary, #10a37f) 10%, transparent),
      transparent 38%
    ),
    var(--studio-surface, #fff);
}

.main-empty-state--preview .main-empty-state__center {
  width: min(100%, 560px);
  max-width: 560px;
  padding: 56px 28px 32px;
  box-sizing: border-box;
}

.main-empty-state--preview .main-empty-state__subtitle {
  max-width: 420px;
  margin: -2px auto 4px;
  color: var(--studio-muted, #6b7280);
  font-size: 14px;
  line-height: 1.55;
}

.main-empty-state--preview .main-empty-state__suggestions {
  width: min(100%, 520px);
  margin: 8px auto 0;
}

.main-empty-state--preview .suggestion-chip {
  cursor: default;
}
</style>
