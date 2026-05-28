<template>
  <article class="message message--assistant message--error">
    <div class="avatar">AI</div>
    <div class="bubble bubble--assistant bubble--error">
      <div class="bubble-meta">Assistant</div>
      <section class="assistant-error-card" role="alert">
        <div class="assistant-error-icon" aria-hidden="true">!</div>
        <div class="assistant-error-body">
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

<style scoped>
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
