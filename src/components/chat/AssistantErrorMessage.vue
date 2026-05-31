<template>
  <article class="message message--assistant message--error tw-flex tw-w-full tw-min-w-0 tw-items-start tw-gap-3">
    <div class="avatar tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-app-assistantAvatar tw-font-bold tw-text-app-assistantAvatarText">AI</div>
    <div class="bubble bubble--assistant bubble--error tw-min-w-0 tw-flex-1">
      <div class="bubble-meta tw-text-xs tw-font-semibold tw-text-app-subtle">Assistant</div>
      <section class="assistant-error-card tw-flex tw-items-start tw-gap-3 tw-rounded-control tw-border" role="alert">
        <div class="assistant-error-icon tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full" aria-hidden="true">!</div>
        <div class="assistant-error-body tw-min-w-0 tw-flex-1">
          <strong>{{ errorTitle }}</strong>
          <p>{{ errorMessage }}</p>
        </div>
      </section>
    </div>
  </article>
</template>

<script setup>
import {computed, onMounted} from "vue";

const props = defineProps({
  message: {type: Object, required: true},
});
const emit = defineEmits(["rendered"]);

const errorTitle = computed(
  () =>
    props.message.errorTitle || props.message.title || "오류가 발생했습니다."
);
const errorMessage = computed(
  () =>
    props.message.errorMessage ||
    props.message.content ||
    "답변을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
);

onMounted(() => emit("rendered", "error"));
</script>

<style scoped lang="scss">
.bubble--error {
  border-color: color-mix(in srgb, #dc2626 28%, var(--prompt-border));
  background: color-mix(in srgb, #dc2626 4%, var(--surface));
}

.assistant-error-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  border: 1px solid color-mix(in srgb, #dc2626 24%, var(--control-border));
  border-radius: 5px;
  background: color-mix(in srgb, #dc2626 7%, var(--surface));
  color: var(--text);
}

.assistant-error-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  min-width: 24px;
  border-radius: 999px;
  background: #dc2626;
  color: #fff;
  font-weight: 900;
  line-height: 1;
}

.assistant-error-body {
  min-width: 0;
}

.assistant-error-body strong {
  display: block;
  margin-bottom: 5px;
  font-size: var(--font-size-base);
  font-weight: 800;
}

.assistant-error-body p {
  margin: 0;
  color: var(--muted);
  font-size: var(--font-size-sm);
  line-height: 1.55;
  white-space: pre-wrap;
}
</style>
