<!--
@file ChatReadonlyInput.vue
@description Composer replacement used when the chat cannot accept new user input, such as shared chats or chats linked to deleted models.
-->

<template>
  <footer
    class="shared-readonly-wrap"
    :class="`shared-readonly-wrap--${variant}`"
    :aria-label="titleText"
  >
    <div class="shared-readonly-box" :class="`shared-readonly-box--${variant}`">
      <span class="shared-readonly-icon" aria-hidden="true">
        <svg v-if="variant === 'deleted-model'" viewBox="0 0 24 24">
          <path
            d="M12 3.5 21 20H3L12 3.5Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path
            d="M12 9v4.4M12 16.8h.01"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24">
          <path
            d="M7 11.5V8a5 5 0 0 1 10 0v3.5M6.5 11.5h11A1.5 1.5 0 0 1 19 13v6a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-6a1.5 1.5 0 0 1 1.5-1.5Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      <span class="shared-readonly-text">
        <strong>{{ titleText }}</strong>
        <span>{{ descriptionText }}</span>
      </span>
    </div>
  </footer>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps({
  variant: { type: String, default: "shared" },
  title: { type: String, default: "" },
  description: { type: String, default: "" },
});

const { t, locale } = useI18n();

/**
 * Returns the localized title shown in the composer replacement.
 * @returns {string} Title text.
 */
const titleText = computed(() => {
  if (props.title) return props.title;
  if (props.variant === "deleted-model") {
    return locale.value === "ko" ? "삭제된 모델입니다." : "This model has been deleted.";
  }
  return t("chat.sharedReadonly");
});

/**
 * Returns the localized description shown below the title.
 * @returns {string} Description text.
 */
const descriptionText = computed(() => {
  if (props.description) return props.description;
  if (props.variant === "deleted-model") {
    return locale.value === "ko"
      ? "이전 대화 내용은 확인할 수 있지만 새 메시지는 보낼 수 없습니다."
      : "You can view this conversation, but you cannot send new messages.";
  }
  return locale.value === "ko"
    ? "이 화면에서는 메시지를 입력하거나 전송할 수 없습니다."
    : "You cannot send messages from this screen.";
});
</script>
