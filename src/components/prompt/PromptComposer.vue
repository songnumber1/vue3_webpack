<template>
  <footer class="prompt-wrap" :class="{'prompt-wrap--floating': floating}">
    <form class="prompt-box prompt-box--gemini" @submit.prevent="submit">
      <PromptAttachmentPreviewList
        :attachments="attachments"
        @preview="previewImage"
        @remove="removeAttachment"
        @preview-error="markPreviewError"
      />

      <PromptTextarea
        ref="textareaComponentRef"
        v-model="text"
        :disabled="disabled"
        :placeholder="placeholder || t('chat.promptPlaceholder')"
        @focus="handleFocus"
        @blur="emit('blur')"
        @input="resize"
        @submit="submit"
        @paste="handlePaste"
      />

      <PromptActionToolbar
        ref="toolbarRef"
        :disabled="disabled"
        :model-readonly="modelReadonly"
        :model-value="modelValue"
        :current-model="currentModel"
        :models="currentModels"
        :tools="tools"
        :model-menu-open="modelMenuOpen"
        :tool-menu-open="toolMenuOpen"
        :attach-menu-open="attachMenuOpen"
        :is-mobile-sheet="isMobileSheet"
        :attach-options="attachOptions"
        :can-submit="canSubmit"
        :has-prompt-text="hasPromptText"
        :is-mic-enabled="isMicEnabled"
        :is-voice-listening="isVoiceListening"
        :has-voice-stopped="hasVoiceStopped"
        :is-speech-supported="isSpeechSupported"
        :voice-start-label="t('chat.voiceStart')"
        :voice-stop-label="t('chat.voiceStop')"
        :attach-label="t('chat.attach')"
        :send-label="t('chat.send')"
        :model-select-label="t('chat.modelSelect')"
        :readonly-title="t('chat.modelReadonly')"
        @open-model="openModelSelector"
        @open-tool="openToolSelector"
        @open-attach="openAttachSelector"
        @select-model="selectModel"
        @apply-tool="applyTool"
        @open-file-picker="openFilePicker"
        @start-voice="startVoiceInput"
        @stop-voice="stopVoiceInput"
      />

      <input
        ref="fileInputRef"
        class="visually-hidden-file-input"
        type="file"
        multiple
        :accept="fileAccept"
        :capture="captureMode"
        @change="handleFileChange"
      />
    </form>
    <p v-if="showHelp" class="prompt-help">
      UI demo. Extend resolver/api.js for production integration.
    </p>

    <PromptMobileSheets
      :model-open="modelMenuOpen && isMobileSheet"
      :tool-open="toolMenuOpen && isMobileSheet"
      :attach-open="attachMenuOpen && isMobileSheet"
      :models="currentModels"
      :tools="tools"
      :model-value="modelValue"
      :attach-options="attachOptions"
      :tool-title="t('chat.tools')"
      :model-title="t('chat.modelSelect')"
      :attach-title="t('chat.attach')"
      @close-model="modelMenuOpen = false"
      @close-tool="toolMenuOpen = false"
      @close-attach="attachMenuOpen = false"
      @select-model="selectModel"
      @apply-tool="applyTool"
      @open-file-picker="openFilePicker"
    />
  </footer>
</template>

<script setup>
import {usePromptComposer} from "@/composables/usePromptComposer";
import PromptActionToolbar from "@/components/prompt/parts/PromptActionToolbar.vue";
import PromptAttachmentPreviewList from "@/components/prompt/parts/PromptAttachmentPreviewList.vue";
import PromptMobileSheets from "@/components/prompt/parts/PromptMobileSheets.vue";
import PromptTextarea from "@/components/prompt/parts/PromptTextarea.vue";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const props = defineProps({
  disabled: {type: Boolean, default: false},
  floating: {type: Boolean, default: false},
  showHelp: {type: Boolean, default: true},
  placeholder: {type: String, default: ""},
  modelValue: {type: String, default: "gpt-5-thinking"},
  models: {type: Array, default: () => []},
  modelReadonly: {type: Boolean, default: false},
});

const emit = defineEmits([
  "submit",
  "focus",
  "blur",
  "height-change",
  "update:modelValue",
]);

const {
  t,
  text,
  textareaComponentRef,
  toolbarRef,
  fileInputRef,
  attachments,
  attachMenuOpen,
  modelMenuOpen,
  toolMenuOpen,
  fileAccept,
  captureMode,
  isMobileSheet,
  isMicEnabled,
  isVoiceListening,
  hasVoiceStopped,
  isSpeechSupported,
  currentModels,
  currentModel,
  tools,
  attachOptions,
  hasPromptText,
  canSubmit,
  resize,
  handleFocus,
  submit,
  openModelSelector,
  openToolSelector,
  openAttachSelector,
  startVoiceInput,
  stopVoiceInput,
  selectModel,
  applyTool,
  openFilePicker,
  handleFileChange,
  handlePaste,
  markPreviewError,
  previewImage,
  removeAttachment,
} = usePromptComposer(props, emit);
</script>
