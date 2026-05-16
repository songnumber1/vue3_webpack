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
          <button
            v-for="option in attachOptions"
            :key="option.id"
            type="button"
            role="menuitem"
            @click="$emit('open-file-picker', option.id)"
          >
            <span aria-hidden="true">{{ option.icon }}</span>
            <p>{{ option.label }}</p>
          </button>
        </div>
      </div>
    </div>

    <button
      v-if="showVoiceStartButton"
      class="voice-button voice-button--start"
      type="button"
      :disabled="disabled || !isSpeechSupported"
      :title="voiceStartLabel"
      :aria-label="voiceStartLabel"
      @click="$emit('start-voice')"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M5 11a7 7 0 0 0 14 0M12 18v3M8.5 21h7"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <button
      v-else-if="showVoiceStopButton"
      class="voice-button voice-button--stop"
      type="button"
      :disabled="disabled"
      :title="voiceStopLabel"
      :aria-label="voiceStopLabel"
      @click="$emit('stop-voice')"
    >
      <span aria-hidden="true"></span>
    </button>

    <button
      v-else
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
import {computed, ref} from 'vue';
import CheckIcon from '@/components/icons/CheckIcon.vue';

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const modelRoot = ref(null);
const toolRoot = ref(null);
const attachRoot = ref(null);

const props = defineProps({
  disabled: {type: Boolean, default: false},
  modelReadonly: {type: Boolean, default: false},
  modelValue: {type: String, default: ''},
  currentModel: {type: Object, required: true},
  models: {type: Array, default: () => []},
  tools: {type: Array, default: () => []},
  attachOptions: {type: Array, default: () => []},
  modelMenuOpen: {type: Boolean, default: false},
  toolMenuOpen: {type: Boolean, default: false},
  attachMenuOpen: {type: Boolean, default: false},
  isMobileSheet: {type: Boolean, default: false},
  canSubmit: {type: Boolean, default: false},
  hasPromptText: {type: Boolean, default: false},
  isMicEnabled: {type: Boolean, default: false},
  isVoiceListening: {type: Boolean, default: false},
  hasVoiceStopped: {type: Boolean, default: false},
  isSpeechSupported: {type: Boolean, default: true},
  voiceStartLabel: {type: String, default: 'Start voice input'},
  voiceStopLabel: {type: String, default: 'Stop voice input'},
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
  'start-voice',
  'stop-voice',
]);

const showVoiceStartButton = computed(
  () =>
    props.isMicEnabled &&
    props.isSpeechSupported &&
    !props.hasPromptText &&
    !props.isVoiceListening
);
const showVoiceStopButton = computed(
  () => props.isMicEnabled && props.isVoiceListening
);

defineExpose({modelRoot, toolRoot, attachRoot});
</script>
