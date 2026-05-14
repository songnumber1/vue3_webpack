<!--
@file MessageActions.vue
@description Assistant/user message action bar.
-->

<template>
  <div class="message-actions" :class="`message-actions--${role}`">
    <button
      v-if="role === 'assistant'"
      type="button"
      :class="{ active: feedback === 'like' }"
      :aria-label="locale === 'ko' ? '좋아요' : 'Like'"
      @click="setFeedback('like')"
    >
      {{ locale === "ko" ? "좋아요" : "Like" }}
    </button>
    <button
      v-if="role === 'assistant'"
      type="button"
      :class="{ active: feedback === 'dislike' }"
      :aria-label="locale === 'ko' ? '싫어요' : 'Dislike'"
      @click="setFeedback('dislike')"
    >
      {{ locale === "ko" ? "싫어요" : "Dislike" }}
    </button>
    <button type="button" :aria-label="locale === 'ko' ? '복사하기' : 'Copy'" @click="copy">
      {{ locale === "ko" ? "복사하기" : "Copy" }}
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { copyClipboardByPlatform } from "@/services/platformBridge";

const props = defineProps({
  role: { type: String, required: true },
  content: { type: String, default: "" }
});
const { locale } = useI18n();
const feedback = ref("");

/**
 * Toggles a feedback value on the current message.
 * @param {'like'|'dislike'} value Feedback action.
 * @returns {void}
 */
function setFeedback(value) {
  feedback.value = feedback.value === value ? "" : value;
}

/**
 * Copies the message text through the platform clipboard bridge when available.
 * @returns {Promise<void>} Copy completion promise.
 */
async function copy() {
  try {
    await copyClipboardByPlatform(props.content || "");
  } catch (error) {
    console.warn("Failed to copy message.", error);
  }
}
</script>
