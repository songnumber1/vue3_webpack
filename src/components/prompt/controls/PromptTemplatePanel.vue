<template>
  <section
    v-if="visible"
    class="prompt-template-panel"
    :class="{'prompt-template-panel--mobile': isMobileSheet}"
    aria-label="Prompt template options"
  >
    <div class="prompt-template-desktop-options">
      <div
        v-for="group in groups"
        :key="group.id"
        class="prompt-template-group"
      >
        <strong class="prompt-template-group-title">{{ group.label }}</strong>
        <div class="prompt-template-chip-row">
          <button
            v-for="option in group.options"
            :key="option.tag"
            class="prompt-template-chip"
            :class="{'is-active': isOptionActive(group, option)}"
            type="button"
            @click="$emit('select-option', group.id, option.tag)"
          >
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="prompt-template-mobile-options">
      <div
        v-for="group in groups"
        :key="group.id"
        class="prompt-template-mobile-group"
      >
        <span class="prompt-template-mobile-title">{{ group.label }}</span>
        <button
          class="prompt-template-mobile-chip"
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
.prompt-template-panel {
  width: 100%;
  margin: 0 0 2px;
  padding: 0;
  border: 0;
  background: transparent;
}

.prompt-template-desktop-options {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0 0 2px;
}

:global(.app-container:not(.app-container--native-scroll-runtime) .prompt-template-desktop-options) {
  scrollbar-width: none;
}

:global(.app-container:not(.app-container--native-scroll-runtime) .prompt-template-desktop-options::-webkit-scrollbar) {
  display: none;
}

.prompt-template-group {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: max-content;
  flex: 0 0 auto;
}

.prompt-template-group-title {
  color: var(--text);
  font-size: var(--font-size-sm);
  font-weight: 900;
  line-height: 1.2;
  white-space: nowrap;
}

.prompt-template-chip-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.prompt-template-chip {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 5px 9px;
  border: 1px solid var(--control-border);
  border-radius: 5px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: var(--font-size-fixed-12);
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 0.16s ease,
    border-color 0.16s ease,
    color 0.16s ease;
}

.prompt-template-chip:hover {
  background: var(--control-hover);
}

.prompt-template-chip.is-active {
  border-color: color-mix(in srgb, var(--accent) 54%, var(--control-border));
  background: color-mix(in srgb, var(--accent) 9%, var(--surface));
  color: var(--accent);
}

.prompt-template-mobile-options {
  display: none;
}

.prompt-template-panel--mobile .prompt-template-desktop-options {
  display: none;
}

.prompt-template-panel--mobile .prompt-template-mobile-options {
  display: flex;
}

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

:global(body.mobile-mode) .prompt-template-desktop-options {
  display: none;
}

@media (max-width: 767px) {
  .prompt-template-desktop-options {
    display: none;
  }
}

:global(body.mobile-mode) .prompt-template-mobile-options {
  display: flex;
}

@media (max-width: 767px) {
  .prompt-template-mobile-options {
    display: flex;
  }
}

.prompt-template-mobile-options {
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0 0 2px;
}

:global(.app-container:not(.app-container--native-scroll-runtime) .prompt-template-mobile-options) {
  scrollbar-width: none;
}

.prompt-template-mobile-group {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 5px;
  min-width: 0;
}

.prompt-template-mobile-title {
  color: var(--text);
  font-size: var(--font-size-sm);
  font-weight: 900;
  line-height: 1.2;
  white-space: nowrap;
}

:global(.app-container:not(.app-container--native-scroll-runtime) .prompt-template-mobile-options) {
  scrollbar-width: none;
}

:global(.app-container:not(.app-container--native-scroll-runtime) .prompt-template-mobile-options::-webkit-scrollbar) {
  display: none;
}

:global(body.mobile-mode) .prompt-template-panel {
  margin-bottom: 4px;
}

.prompt-template-mobile-chip {
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  padding: 6px 10px;
  border: 1px solid var(--control-border);
  border-radius: 5px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: 800;
  line-height: 1.2;
  cursor: pointer;
  white-space: nowrap;
}
</style>
