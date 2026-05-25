<template>
  <footer class="prompt-wrap" :class="{'prompt-wrap--floating': floating}">
    <form class="prompt-box prompt-box--gemini" @submit.prevent="submit">
      <!-- input에 추가되는 이미지 미리보기 -->
      <PromptAttachmentPreviewList
        :attachments="attachments"
        @preview="previewImage"
        @remove="removeAttachment"
        @preview-error="markPreviewError"
      />

      <PromptTemplatePanel
        :visible="hasSelectedTemplatePanel"
        :groups="selectedTemplateGroups"
        :active-mobile-group="activeMobileGroup"
        :is-option-active="isTemplateOptionActive"
        @select-option="selectTemplateOption"
        @open-mobile-group="openTemplateOptionSheet"
        @close-mobile-group="closeTemplateOptionSheet"
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
        :disabled="actionDisabled"
        :generating="generating"
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
/**
 * @file components/prompt/PromptComposer.vue
 * @description 프롬프트 입력 UI 컴포넌트입니다. 텍스트, 첨부, 도구/모델 선택 이벤트를 composable action으로 전달합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {usePromptComposer} from "@/composables/prompt/usePromptComposer";
import PromptActionToolbar from "@/components/prompt/controls/PromptActionToolbar.vue";
import PromptAttachmentPreviewList from "@/components/prompt/controls/PromptAttachmentPreviewList.vue";
import PromptMobileSheets from "@/components/prompt/controls/PromptMobileSheets.vue";
import PromptTextarea from "@/components/prompt/controls/PromptTextarea.vue";
import PromptTemplatePanel from "@/components/prompt/controls/PromptTemplatePanel.vue";

/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
const props = defineProps({
  disabled: {type: Boolean, default: false},
  generating: {type: Boolean, default: false},
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
  selectedTemplateGroups,
  hasSelectedTemplatePanel,
  activeMobileGroup,
  isTemplateOptionActive,
  selectTemplateOption,
  openTemplateOptionSheet,
  closeTemplateOptionSheet,
  attachOptions,
  hasPromptText,
  canSubmit,
  actionDisabled,
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
  setText,
} = usePromptComposer(props, emit);

defineExpose({
  setText,
});
</script>

<style scoped>
/* The base prompt border is component-owned; browser/keyboard patches remain global. */
.prompt-box,
.prompt-box--gemini {
  border: 1px solid var(--prompt-border);
}

:global(body.mobile-mode) .prompt-box,
:global(body.mobile-mode) .prompt-box--gemini {
  border: 1px solid var(--prompt-border);
}
</style>
