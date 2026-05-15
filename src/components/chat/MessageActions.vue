<!--
@file MessageActions.vue
@description Assistant/user message action bar. Assistant messages expose like, dislike, explicit feedback, and clipboard actions as icon buttons.
-->

<template>
  <div class="message-actions-wrap" :class="`message-actions-wrap--${role}`">
    <div class="message-actions" :class="`message-actions--${role}`">
      <template v-if="role === 'assistant'">
        <button
          type="button"
          class="message-action-icon"
          :class="{ active: feedback === FEEDBACK_ACTIONS.LIKE }"
          :aria-label="t('feedback.like')"
          :title="t('feedback.like')"
          @click="setFeedback(FEEDBACK_ACTIONS.LIKE)"
        >
          <span aria-hidden="true">👍</span>
        </button>
        <button
          type="button"
          class="message-action-icon"
          :class="{ active: feedback === FEEDBACK_ACTIONS.DISLIKE }"
          :aria-label="t('feedback.dislike')"
          :title="t('feedback.dislike')"
          @click="setFeedback(FEEDBACK_ACTIONS.DISLIKE)"
        >
          <span aria-hidden="true">👎</span>
        </button>
        <button
          type="button"
          class="message-action-icon"
          :aria-label="t('feedback.send')"
          :title="t('feedback.send')"
          @click="feedbackPanelOpen = !feedbackPanelOpen"
        >
          <span aria-hidden="true">💬</span>
        </button>
      </template>

      <button
        type="button"
        class="message-action-icon"
        :aria-label="t('feedback.copy')"
        :title="t('feedback.copy')"
        @click="copy"
      >
        <span aria-hidden="true">⧉</span>
      </button>
    </div>

    <section v-if="showDislikeReasons" class="feedback-reason-panel">
      <p>{{ t('feedback.hallucinationTitle') }}</p>
      <div class="feedback-reason-list">
        <button
          v-for="reason in visibleReasons"
          :key="reason.id"
          class="feedback-reason-chip"
          type="button"
          :class="{ active: selectedReasons.includes(reason.id) }"
          @click="toggleReason(reason.id)"
        >
          {{ reasonLabel(reason) }}
        </button>
      </div>
      <button
        v-if="hasMoreReasons"
        class="feedback-more-button"
        type="button"
        @click="showAllReasons = true"
      >
        {{ t('feedback.more') }}
      </button>
    </section>

    <section v-if="feedbackPanelOpen" class="feedback-send-panel">
      <strong>{{ t('feedback.send') }}</strong>
      <p>{{ t('feedback.sendDescription') }}</p>
      <!-- TODO: 출처, 이미지, DUO 검색 결과 등 추가 기능 feedback payload 확장 시 이 영역에 message extension selector를 연결한다. -->
      <textarea :placeholder="t('feedback.placeholder')"></textarea>
      <button type="button" @click="feedbackPanelOpen = false">
        {{ t('common.close') }}
      </button>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { FEEDBACK_ACTIONS, HALLUCINATION_REASONS } from "@/constants/feedback";
import { copyClipboardByPlatform } from "@/services/platformBridge";

const props = defineProps({
  role: { type: String, required: true },
  content: { type: String, default: "" },
});
const { t, locale } = useI18n();
const feedback = ref("");
const feedbackPanelOpen = ref(false);
const showAllReasons = ref(false);
const selectedReasons = ref([]);
const defaultReasonCount = 4;

const showDislikeReasons = computed(
  () => props.role === "assistant" && feedback.value === FEEDBACK_ACTIONS.DISLIKE,
);
const visibleReasons = computed(() =>
  showAllReasons.value
    ? HALLUCINATION_REASONS
    : HALLUCINATION_REASONS.slice(0, defaultReasonCount),
);
const hasMoreReasons = computed(
  () => !showAllReasons.value && HALLUCINATION_REASONS.length > defaultReasonCount,
);

/**
 * Toggles a feedback value on the current message and resets nested panels when needed.
 * @param {'like'|'dislike'} value Feedback action.
 * @returns {void}
 */
function setFeedback(value) {
  feedback.value = feedback.value === value ? "" : value;
  if (feedback.value !== FEEDBACK_ACTIONS.DISLIKE) {
    showAllReasons.value = false;
    selectedReasons.value = [];
  }
}

/**
 * Returns a localized hallucination reason label.
 * @param {{ko: string, en: string}} reason Feedback reason object.
 * @returns {string} Localized reason label.
 */
function reasonLabel(reason) {
  return locale.value === "ko" ? reason.ko : reason.en;
}

/**
 * Adds or removes a selected hallucination reason id.
 * @param {string} id Feedback reason id.
 * @returns {void}
 */
function toggleReason(id) {
  selectedReasons.value = selectedReasons.value.includes(id)
    ? selectedReasons.value.filter((item) => item !== id)
    : [...selectedReasons.value, id];
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
