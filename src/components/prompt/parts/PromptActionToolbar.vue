<!--
@file PromptActionToolbar.vue
@description Renders prompt composer actions: model selector, tools, attachment menu and send button.
-->

<template>
  <div class="prompt-action-row">
    <div class="prompt-left-actions">
      <div ref="modelRoot" class="prompt-selector-wrap">
        <button
          class="prompt-model-trigger"
          type="button"
          :disabled="disabled || modelReadonly"
          :title="modelReadonly ? readonlyTitle : undefined"
          :aria-label="modelSelectLabel"
          @click="$emit('open-model')"
        >
          <span>{{ currentModel.label }}</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M5.5 7.5 10 12l4.5-4.5"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <div v-if="modelMenuOpen && !isMobileSheet" class="prompt-popover model-menu prompt-model-menu">
          <button
            v-for="model in models"
            :key="model.id"
            class="model-option"
            :class="{active: model.id === modelValue}"
            type="button"
            @click="$emit('select-model', model.id)"
          >
            <span class="model-option-main">
              <strong>{{ model.label }}</strong>
              <small>{{ model.description }}</small>
            </span>
            <CheckIcon v-if="model.id === modelValue" class="option-check" />
          </button>
        </div>
      </div>

      <div ref="toolRoot" class="prompt-selector-wrap">
        <button
          class="prompt-icon-action"
          :class="{'prompt-icon-action--active': toolMenuOpen}"
          type="button"
          :disabled="disabled"
          aria-label="Tools"
          @click="$emit('open-tool')"
        >
          ＋
        </button>
        <div v-if="toolMenuOpen && !isMobileSheet" class="prompt-popover prompt-tool-menu">
          <button v-for="tool in tools" :key="tool.id" type="button" @click="$emit('apply-tool', tool)">
            <span aria-hidden="true">{{ tool.icon }}</span>
            <p>{{ tool.label }}</p>
          </button>
        </div>
      </div>

      <div ref="attachRoot" class="prompt-selector-wrap attach-menu-wrap">
        <button
          class="prompt-icon-action attach-button"
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
        <div v-if="attachMenuOpen && !isMobileSheet" class="prompt-popover attach-menu" role="menu">
          <button v-if="showCameraMenu" type="button" role="menuitem" @click="$emit('open-file-picker', 'camera')">
            <span aria-hidden="true">📷</span>
            <p>Camera</p>
          </button>
          <button type="button" role="menuitem" @click="$emit('open-file-picker', 'image')">
            <span aria-hidden="true">🖼️</span>
            <p>Image</p>
          </button>
          <button type="button" role="menuitem" @click="$emit('open-file-picker', 'all')">
            <span aria-hidden="true">📎</span>
            <p>File</p>
          </button>
        </div>
      </div>
    </div>

    <button
      class="send-button"
      type="submit"
      :disabled="disabled || !canSubmit"
      :title="sendLabel"
      :aria-label="sendLabel"
    >
      ↗
    </button>
  </div>
</template>

<script setup>
import {ref} from 'vue';
import CheckIcon from '@/components/icons/CheckIcon.vue';

const modelRoot = ref(null);
const toolRoot = ref(null);
const attachRoot = ref(null);

defineProps({
  disabled: {type: Boolean, default: false},
  modelReadonly: {type: Boolean, default: false},
  modelValue: {type: String, default: ''},
  currentModel: {type: Object, required: true},
  models: {type: Array, default: () => []},
  tools: {type: Array, default: () => []},
  modelMenuOpen: {type: Boolean, default: false},
  toolMenuOpen: {type: Boolean, default: false},
  attachMenuOpen: {type: Boolean, default: false},
  isMobileSheet: {type: Boolean, default: false},
  showCameraMenu: {type: Boolean, default: false},
  canSubmit: {type: Boolean, default: false},
  attachLabel: {type: String, default: 'Attach'},
  sendLabel: {type: String, default: 'Send'},
  modelSelectLabel: {type: String, default: 'Select model'},
  readonlyTitle: {type: String, default: '대화방 모델은 변경할 수 없습니다.'},
});

defineEmits([
  'open-model',
  'open-tool',
  'open-attach',
  'select-model',
  'apply-tool',
  'open-file-picker',
]);

defineExpose({modelRoot, toolRoot, attachRoot});
</script>
