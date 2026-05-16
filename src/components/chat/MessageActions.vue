<template>
  <div class="message-actions-wrap" :class="`message-actions-wrap--${role}`">
    <div class="message-actions" :class="`message-actions--${role}`">
      <template v-if="role === 'assistant'">
        <button
          type="button"
          class="message-action-icon message-action-icon--svg"
          :class="{active: feedback === FEEDBACK_ACTIONS.LIKE}"
          :aria-label="t('feedback.like')"
          :title="t('feedback.like')"
          @click="setFeedback(FEEDBACK_ACTIONS.LIKE)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M7.8 21H5.3A2.3 2.3 0 0 1 3 18.7v-7.1a2.3 2.3 0 0 1 2.3-2.3h2.5m0 11.7V9.3m0 11.7h8.5a2.4 2.4 0 0 0 2.3-1.8l1.5-6.3a2.2 2.2 0 0 0-2.1-2.7h-4.3l.7-3.1a3 3 0 0 0-.8-2.8l-.4-.4a1.3 1.3 0 0 0-2 .2L7.8 9.3"
              fill="none"
              stroke="currentColor"
              stroke-width="1.9"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          class="message-action-icon message-action-icon--svg"
          :class="{active: feedback === FEEDBACK_ACTIONS.DISLIKE}"
          :aria-label="t('feedback.dislike')"
          :title="t('feedback.dislike')"
          @click="setFeedback(FEEDBACK_ACTIONS.DISLIKE)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M16.2 3h2.5A2.3 2.3 0 0 1 21 5.3v7.1a2.3 2.3 0 0 1-2.3 2.3h-2.5m0-11.7v11.7m0-11.7H7.7a2.4 2.4 0 0 0-2.3 1.8L3.9 11.1a2.2 2.2 0 0 0 2.1 2.7h4.3l-.7 3.1a3 3 0 0 0 .8 2.8l.4.4a1.3 1.3 0 0 0 2-.2l3.4-5.2"
              fill="none"
              stroke="currentColor"
              stroke-width="1.9"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          class="message-action-text-button"
          @click="openFeedbackDialog"
        >
          {{ t("feedback.send") }}
        </button>
      </template>

      <button
        type="button"
        class="message-action-icon message-action-icon--svg"
        :aria-label="t('feedback.copy')"
        :title="t('feedback.copy')"
        @click="copy"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M8 8.5A2.5 2.5 0 0 1 10.5 6h7A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-7A2.5 2.5 0 0 1 8 17.5v-9Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.9"
          />
          <path
            d="M5 15.5H4.8A2.8 2.8 0 0 1 2 12.7V4.8A2.8 2.8 0 0 1 4.8 2h7.9A2.8 2.8 0 0 1 15.5 4.8V5"
            fill="none"
            stroke="currentColor"
            stroke-width="1.9"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>

    <section v-if="showDislikeReasons" class="feedback-reason-panel">
      <p>{{ t("feedback.hallucinationTitle") }}</p>
      <div class="feedback-reason-list">
        <button
          v-for="reason in visibleReasons"
          :key="reason.id"
          class="feedback-reason-chip"
          type="button"
          :class="{active: selectedReasons.includes(reason.id)}"
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
        {{ t("feedback.more") }}
      </button>
    </section>

    <teleport to="body">
      <div
        v-if="feedbackDialogOpen"
        class="feedback-dialog-backdrop"
        role="presentation"
        @click.self="closeFeedbackDialog"
      >
        <section
          class="feedback-dialog"
          role="dialog"
          aria-modal="true"
          :aria-label="t('feedback.send')"
        >
          <header class="feedback-dialog-header">
            <strong>{{ t("feedback.send") }}</strong>
            <button
              type="button"
              class="feedback-dialog-close"
              :aria-label="t('common.close')"
              @click="closeFeedbackDialog"
            >
              ×
            </button>
          </header>
          <div class="feedback-dialog-body">
            <p>{{ t("feedback.sendDescription") }}</p>
            <textarea
              v-model="feedbackText"
              :placeholder="t('feedback.placeholder')"
            />
          </div>
          <footer class="feedback-dialog-footer">
            <button type="button" @click="submitFeedback">
              {{ t("common.confirm") }}
            </button>
            <button type="button" @click="closeFeedbackDialog">
              {{ t("common.close") }}
            </button>
          </footer>
        </section>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {FEEDBACK_ACTIONS, HALLUCINATION_REASONS} from "@/constants/feedback";
import {copyClipboardByPlatform} from "@/services/platformBridge";
import {logWarn} from "@/utils/logger";

const props = defineProps({
  role: {type: String, required: true},
  content: {type: String, default: ""},
});
const {t, locale} = useI18n();
const feedback = ref("");
const feedbackDialogOpen = ref(false);
const feedbackText = ref("");
const showAllReasons = ref(false);
const selectedReasons = ref([]);
const defaultReasonCount = 4;

const showDislikeReasons = computed(
  () =>
    props.role === "assistant" && feedback.value === FEEDBACK_ACTIONS.DISLIKE
);
const visibleReasons = computed(() =>
  showAllReasons.value
    ? HALLUCINATION_REASONS
    : HALLUCINATION_REASONS.slice(0, defaultReasonCount)
);
const hasMoreReasons = computed(
  () =>
    !showAllReasons.value && HALLUCINATION_REASONS.length > defaultReasonCount
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
 * Opens the explicit feedback dialog with a textarea and footer actions.
 * @returns {void}
 */
function openFeedbackDialog() {
  feedbackDialogOpen.value = true;
}

/**
 * Closes the explicit feedback dialog without mutating message content.
 * @returns {void}
 */
function closeFeedbackDialog() {
  feedbackDialogOpen.value = false;
}

/**
 * Mock submit handler for future message feedback API integration.
 * @returns {void}
 */
function submitFeedback() {
  // 실제 feedback API 연동 전까지는 입력값만 초기화한다.
  feedbackText.value = "";
  closeFeedbackDialog();
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
    logWarn("Failed to copy message.", error);
  }
}
</script>
