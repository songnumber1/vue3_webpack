<template>
  <div
    ref="attachRoot"
    class="prompt-selector-wrap attach-menu-wrap tw-relative tw-min-w-0"
  >
    <button
      class="prompt-icon-action attach-button tw-inline-flex tw-items-center tw-justify-center tw-rounded-control tw-border tw-border-app-controlBorder tw-bg-app-control tw-transition"
      :class="{'prompt-icon-action--active': attachMenuOpen}"
      type="button"
      :title="attachLabel"
      :aria-label="attachLabel"
      :disabled="disabled"
      @click="$emit('open-attach')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M21.4 11.6 12.1 20.9a6 6 0 0 1-8.5-8.5l9.6-9.6a4.1 4.1 0 0 1 5.8 5.8l-9.4 9.4a2.2 2.2 0 1 1-3.1-3.1l8.6-8.6"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <PromptAttachFloatMenu
      :open="attachMenuOpen && !isMobileSheet"
      :reference-element="attachRoot"
      :attach-options="attachOptions"
      @open-file-picker="$emit('open-file-picker', $event)"
    />
  </div>
</template>

<script setup>
/**
 * @file components/prompt/controls/PromptAttachButton.vue
 * @description 프롬프트 첨부 버튼입니다. PC 첨부 메뉴는 별도 FloatMenu 컴포넌트로 직접 import합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {ref} from "vue";
import PromptAttachFloatMenu from "@/components/prompt/attach/desktop/PromptAttachFloatMenu.vue";

/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
defineProps({
  disabled: {type: Boolean, default: false},
  attachOptions: {type: Array, default: () => []},
  attachMenuOpen: {type: Boolean, default: false},
  isMobileSheet: {type: Boolean, default: false},
  attachLabel: {type: String, default: "Attach"},
});

defineEmits(["open-attach", "open-file-picker"]);

const attachRoot = ref(null);

defineExpose({attachRoot});
</script>

<style scoped lang="scss">
.prompt-selector-wrap {
  min-width: 0;
}
</style>
