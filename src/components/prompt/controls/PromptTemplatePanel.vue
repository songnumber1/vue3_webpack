<template>
  <section
    v-if="visible"
    class="prompt-template-panel tw-mt-0 tw-mb-[2px] tw-w-full tw-border-0 tw-bg-transparent tw-p-0"
    :class="{'prompt-template-panel--mobile': isMobileSheet}"
    aria-label="Prompt template options"
  >
    <div
      class="prompt-template-desktop-options tw-w-full tw-min-w-0 tw-items-center tw-gap-[10px] tw-overflow-x-auto tw-overflow-y-hidden tw-pb-[2px] tw-[scrollbar-width:none] [&::-webkit-scrollbar]:tw-hidden"
      :class="isMobileSheet ? 'tw-hidden' : 'tw-flex'"
    >
      <div
        v-for="group in groups"
        :key="group.id"
        class="prompt-template-group tw-inline-flex tw-min-w-max tw-flex-none tw-items-center tw-gap-[6px]"
      >
        <strong class="prompt-template-group-title tw-whitespace-nowrap tw-text-sm tw-font-black tw-leading-[1.2] tw-text-app-text">{{ group.label }}</strong>
        <div class="prompt-template-chip-row tw-inline-flex tw-min-w-0 tw-items-center tw-gap-1">
          <button
            v-for="option in group.options"
            :key="option.tag"
            class="prompt-template-chip tw-inline-flex tw-min-h-[30px] tw-cursor-pointer tw-items-center tw-justify-center tw-gap-[6px] tw-whitespace-nowrap tw-rounded-[5px] tw-border tw-border-solid tw-px-[9px] tw-py-[5px] tw-font-app tw-text-fixed12 tw-font-extrabold tw-transition-colors tw-duration-fast"
            :class="isOptionActive(group, option)
              ? 'is-active tw-border-[color-mix(in_srgb,var(--accent)_54%,var(--control-border))] tw-bg-[color-mix(in_srgb,var(--accent)_9%,var(--surface))] tw-text-app-accent'
              : 'tw-border-app-controlBorder tw-bg-app-surface tw-text-app-text hover:tw-bg-app-controlHover'"
            type="button"
            @click="$emit('select-option', group.id, option.tag)"
          >
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <div
      class="prompt-template-mobile-options tw-w-full tw-min-w-0 tw-items-center tw-gap-2 tw-overflow-x-auto tw-overflow-y-hidden tw-pb-[2px] tw-[scrollbar-width:none] [&::-webkit-scrollbar]:tw-hidden"
      :class="isMobileSheet ? 'tw-flex' : 'tw-hidden'"
    >
      <div
        v-for="group in groups"
        :key="group.id"
        class="prompt-template-mobile-group tw-inline-flex tw-min-w-0 tw-flex-none tw-items-center tw-gap-[5px]"
      >
        <span class="prompt-template-mobile-title tw-whitespace-nowrap tw-text-sm tw-font-black tw-leading-[1.2] tw-text-app-text">{{ group.label }}</span>
        <button
          class="prompt-template-mobile-chip tw-inline-flex tw-min-h-8 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-[5px] tw-border tw-border-solid tw-border-app-controlBorder tw-bg-app-surface tw-px-[10px] tw-py-[6px] tw-font-app tw-text-sm tw-font-extrabold tw-leading-[1.2] tw-text-app-text"
          type="button"
          :aria-label="`${group.label}: ${group.selectedLabel}`"
          @click="$emit('open-mobile-group', group.id)"
        >
          <span>{{ group.selectedLabel }}</span>
        </button>
      </div>
    </div>

    <BaseBottomSheet
      :open="Boolean(activeMobileGroup)"
      :title="activeMobileGroup?.label || ''"
      @close="$emit('close-mobile-group')"
    >
      <button
        v-for="option in activeMobileGroup?.options || []"
        :key="option.tag"
        class="bottom-sheet-option bottom-sheet-option--row prompt-template-sheet-option"
        :class="{'is-active': isOptionActive(activeMobileGroup, option)}"
        type="button"
        @click="$emit('select-option', activeMobileGroup.id, option.tag)"
      >
        <strong>{{ option.label }}</strong>
        <span
          v-if="isOptionActive(activeMobileGroup, option)"
          class="prompt-template-sheet-check"
          aria-hidden="true"
          >✓</span
        >
      </button>
    </BaseBottomSheet>
  </section>
</template>

<script setup>
/**
 * @file components/prompt/controls/PromptTemplatePanel.vue
 * @description 프롬프트 입력 UI 컴포넌트입니다. 텍스트, 첨부, 도구/모델 선택 이벤트를 composable action으로 전달합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";

defineProps({
  visible: {type: Boolean, default: false},
  isMobileSheet: {type: Boolean, default: false},
  groups: {type: Array, default: () => []},
  activeMobileGroup: {type: Object, default: null},
  isOptionActive: {type: Function, required: true},
});

defineEmits(["select-option", "open-mobile-group", "close-mobile-group"]);
</script>

<style scoped lang="scss">
/*
 * C-2 note:
 * Desktop/mobile chip presentation is now owned by tw-* utilities in the template.
 * Keep only the bottom-sheet option rules here because BaseBottomSheet option rows are
 * intentionally excluded from this migration step.
 */
.prompt-template-sheet-option {
  justify-content: flex-start;
  text-align: left;
  border: 1px solid transparent;
}

.prompt-template-sheet-option strong {
  flex: 1 1 auto;
  min-width: 0;
  text-align: left;
}

.prompt-template-sheet-option.is-active {
  border-color: color-mix(in srgb, var(--accent) 48%, var(--control-border));
  background: color-mix(in srgb, var(--accent) 10%, var(--control-hover));
  color: var(--text);
}

.prompt-template-sheet-check {
  width: auto !important;
  min-width: 20px !important;
  flex: 0 0 auto !important;
  margin-left: auto;
  color: var(--accent);
  font-size: var(--font-size-md) !important;
  font-weight: 900;
  text-align: right !important;
}
</style>
