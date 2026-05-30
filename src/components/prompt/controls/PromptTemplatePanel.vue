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
