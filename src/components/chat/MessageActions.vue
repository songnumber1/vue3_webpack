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
          <img class="message-action-img" :src="likeIcon" alt="" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="message-action-icon message-action-icon--svg"
          :class="{active: feedback === FEEDBACK_ACTIONS.DISLIKE}"
          :aria-label="t('feedback.dislike')"
          :title="t('feedback.dislike')"
          @click="setFeedback(FEEDBACK_ACTIONS.DISLIKE)"
        >
          <img class="message-action-img" :src="dislikeIcon" alt="" aria-hidden="true" />
        </button>
        <button
          type="button"
          class="message-action-text-button"
          @click="$emit('regenerate')"
        >
          {{ t("markdown.regenerate") }}
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
        <img class="message-action-img" :src="copyIcon" alt="" aria-hidden="true" />
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
        class="feedback-dialog-backdrop app-dialog-backdrop"
        role="presentation"
        @click.self="closeFeedbackDialog"
      >
        <section
          class="feedback-dialog app-dialog-panel"
          role="dialog"
          aria-modal="true"
          :aria-label="t('feedback.send')"
        >
          <header class="feedback-dialog-header app-dialog-header">
            <strong>{{ t("feedback.send") }}</strong>
            <button
              type="button"
              class="feedback-dialog-close app-dialog-close"
              :aria-label="t('common.close')"
              @click="closeFeedbackDialog"
            >
              ×
            </button>
          </header>
          <div class="feedback-dialog-body app-dialog-body">
            <p>{{ t("feedback.sendDescription") }}</p>
            <textarea
              v-model="feedbackText"
              :placeholder="t('feedback.placeholder')"
            />
          </div>
          <footer class="feedback-dialog-footer app-dialog-footer">
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
import copyIcon from "@/assets/img/icons/copy.svg";
import dislikeIcon from "@/assets/img/icons/dislike.svg";
import likeIcon from "@/assets/img/icons/like.svg";
import {copyClipboardByPlatform} from "@/services/platformBridge";
import {logWarn} from "@/utils/logger";

defineEmits(["regenerate"]);

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
function setFeedback(value) {
  feedback.value = feedback.value === value ? "" : value;
  if (feedback.value !== FEEDBACK_ACTIONS.DISLIKE) {
    showAllReasons.value = false;
    selectedReasons.value = [];
  }
}
function openFeedbackDialog() {
  feedbackDialogOpen.value = true;
}
function closeFeedbackDialog() {
  feedbackDialogOpen.value = false;
}
function submitFeedback() {
  feedbackText.value = "";
  closeFeedbackDialog();
}
function reasonLabel(reason) {
  return locale.value === "ko" ? reason.ko : reason.en;
}
function toggleReason(id) {
  selectedReasons.value = selectedReasons.value.includes(id)
    ? selectedReasons.value.filter((item) => item !== id)
    : [...selectedReasons.value, id];
}
async function copy() {
  try {
    await copyClipboardByPlatform(props.content || "");
  } catch (error) {
    logWarn("Failed to copy message.", error);
  }
}
</script>

<style scoped>
.message-actions {
  min-width: 0;
}

.feedback-button,
.copy-button {
  box-sizing: border-box;
}

.message-action-text-button,
.message-action-text-button:hover,
.message-action-text-button:focus,
.message-action-text-button:focus-visible,
.message-action-text-button:active {
  border-radius: 5px;
}
</style>
