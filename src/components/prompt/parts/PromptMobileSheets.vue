<!--
@file PromptMobileSheets.vue
@description Mobile bottom sheets used by the prompt composer for model, tool and attachment actions.
-->

<template>
  <BaseBottomSheet :open="modelOpen" :title="modelTitle" @close="$emit('close-model')">
    <button
      v-for="model in models"
      :key="model.id"
      class="bottom-sheet-option"
      :class="{active: model.id === modelValue}"
      type="button"
      @click="$emit('select-model', model.id)"
    >
      <span class="bottom-sheet-option-main">
        <strong>{{ model.label }}</strong>
        <small>{{ model.description }}</small>
      </span>
      <CheckIcon v-if="model.id === modelValue" class="bottom-sheet-check" />
    </button>
  </BaseBottomSheet>

  <BaseBottomSheet :open="toolOpen" title="Tools" @close="$emit('close-tool')">
    <button
      v-for="tool in tools"
      :key="tool.id"
      class="bottom-sheet-option bottom-sheet-option--row"
      type="button"
      @click="$emit('apply-tool', tool)"
    >
      <span aria-hidden="true">{{ tool.icon }}</span>
      <strong>{{ tool.label }}</strong>
    </button>
  </BaseBottomSheet>

  <BaseBottomSheet :open="attachOpen" :title="attachTitle" @close="$emit('close-attach')">
    <button
      v-if="showCameraMenu"
      class="bottom-sheet-option bottom-sheet-option--row"
      type="button"
      @click="$emit('open-file-picker', 'camera')"
    >
      <span aria-hidden="true">📷</span><strong>Camera</strong>
    </button>
    <button class="bottom-sheet-option bottom-sheet-option--row" type="button" @click="$emit('open-file-picker', 'image')">
      <span aria-hidden="true">🖼️</span><strong>Image</strong>
    </button>
    <button class="bottom-sheet-option bottom-sheet-option--row" type="button" @click="$emit('open-file-picker', 'all')">
      <span aria-hidden="true">📎</span><strong>File</strong>
    </button>
  </BaseBottomSheet>
</template>

<script setup>
import BaseBottomSheet from '@/components/common/bottom-sheet/BaseBottomSheet.vue';
import CheckIcon from '@/components/icons/CheckIcon.vue';

defineProps({
  modelOpen: {type: Boolean, default: false},
  toolOpen: {type: Boolean, default: false},
  attachOpen: {type: Boolean, default: false},
  models: {type: Array, default: () => []},
  tools: {type: Array, default: () => []},
  modelValue: {type: String, default: ''},
  showCameraMenu: {type: Boolean, default: false},
  modelTitle: {type: String, default: '모델 선택'},
  attachTitle: {type: String, default: '첨부'},
});

defineEmits([
  'close-model',
  'close-tool',
  'close-attach',
  'select-model',
  'apply-tool',
  'open-file-picker',
]);
</script>
