<template>
  <article class="message message--assistant message--error">
    <div class="avatar">AI</div>
    <div class="bubble bubble--assistant bubble--error border-[color-mix(in_srgb,#dc2626_28%,var(--prompt-border))] bg-[color-mix(in_srgb,#dc2626_4%,var(--surface))]">
      <div class="bubble-meta">Assistant</div>
      <section class="assistant-error-card flex items-start gap-3 rounded-ui border border-[color-mix(in_srgb,#dc2626_24%,var(--control-border))] bg-[color-mix(in_srgb,#dc2626_7%,var(--surface))] p-3.5 text-app-text" role="alert">
        <div class="assistant-error-icon inline-flex size-6 min-w-6 items-center justify-center rounded-full bg-red-600 font-black leading-none text-white" aria-hidden="true">!</div>
        <div class="assistant-error-body min-w-0 [&>strong]:mb-[5px] [&>strong]:block [&>strong]:text-[var(--font-size-base)] [&>strong]:font-extrabold [&>p]:m-0 [&>p]:whitespace-pre-wrap [&>p]:text-[var(--font-size-sm)] [&>p]:leading-[1.55] [&>p]:text-[var(--muted)]">
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
