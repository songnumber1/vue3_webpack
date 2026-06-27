<template>
  <button
    class="prompt-expand-toggle"
    :class="buttonClass"
    type="button"
    :title="label"
    :aria-label="label"
    :aria-pressed="expanded"
    @click="$emit('toggle')"
  >
    <svg v-if="!expanded" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <svg v-else viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 3v6H3M15 3v6h6M21 15h-6v6M3 15h6v6"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>

<script setup>
/**
 * @file components/prompt/controls/PromptExpandToggle.vue
 * @description 프롬프트 입력창 최대화/최소화 토글 버튼입니다.
 */

defineProps({
  expanded: {type: Boolean, default: false},
  label: {type: String, required: true},
  buttonClass: {type: [String, Array, Object], default: ""},
});

defineEmits(["toggle"]);
</script>
