<template>
  <footer
    class="prompt-wrap tw-w-full"
    :class="{
      'prompt-wrap--floating': floating,
      'prompt-wrap--expanded': isPromptExpanded,
    }"
  >
    <form
      class="prompt-box prompt-box--gemini tw-relative tw-flex tw-w-full tw-flex-col tw-border tw-border-app-promptBorder tw-bg-app-prompt tw-shadow-prompt"
      :class="{'prompt-box--expanded': isPromptExpanded}"
      @submit.prevent="submit"
    >
      <PromptAttachmentPreviewList
        :attachments="attachments"
        @preview="previewImage"
        @remove="removeAttachment"
        @preview-error="markPreviewError"
      />

      <PromptTemplatePanel
        :visible="hasSelectedTemplatePanel"
        :is-mobile-sheet="isMobileSheet"
        :groups="selectedTemplateGroups"
        :active-mobile-group="activeMobileGroup"
        :is-option-active="isTemplateOptionActive"
        @select-option="selectTemplateOption"
        @open-mobile-group="openTemplateOptionSheet"
        @close-mobile-group="closeTemplateOptionSheet"
      />

      <button
        class="prompt-expand-toggle"
        type="button"
        :title="promptExpandToggleLabel"
        :aria-label="promptExpandToggleLabel"
        :aria-pressed="isPromptExpanded"
        @click="togglePromptExpanded"
      >
        <svg v-if="!isPromptExpanded" viewBox="0 0 24 24" aria-hidden="true">
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

      <PromptTextarea
        ref="textareaComponentRef"
        @focus="handleFocus"
        @blur="emit('blur')"
        @input="resize"
        @submit="submit"
        @paste="handlePaste"
      />

      <component
        :is="resolvedToolbarComponent"
        ref="toolbarRef"
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
        class="visually-hidden-file-input tw-sr-only"
        type="file"
        multiple
        :accept="fileAccept"
        :capture="captureMode"
        @change="handleFileChange"
      />
    </form>
    <p
      v-if="showHelp"
      class="prompt-help tw-mt-2 tw-text-center tw-text-xs tw-text-app-subtle"
    >
      UI demo. Extend resolver/api.js for production integration.
    </p>

    <PromptMobileBottomSheets
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
 * @description 프롬프트 입력 UI 컴포넌트입니다. Prompt 상태는 PROMPT_STATE_KEY로 주입받고, 내부 툴바 상태는 PROMPT_TOOLBAR_STATE_KEY로 제공합니다.
 */

import {
  computed,
  inject,
  nextTick,
  onBeforeUnmount,
  provide,
  reactive,
  watch,
} from "vue";
import {usePromptComposer} from "@/composables/prompt/usePromptComposer";
import PromptToolbarDesktop from "@/components/prompt/controls/PromptToolbarDesktop.vue";
import PromptToolbarMobile from "@/components/prompt/controls/PromptToolbarMobile.vue";
import PromptAttachmentPreviewList from "@/components/prompt/controls/PromptAttachmentPreviewList.vue";
import PromptMobileBottomSheets from "@/components/prompt/controls/PromptMobileBottomSheets.vue";
import PromptTextarea from "@/components/prompt/controls/PromptTextarea.vue";
import PromptTemplatePanel from "@/components/prompt/controls/PromptTemplatePanel.vue";
import {
  PROMPT_STATE_KEY,
  PROMPT_TEXTAREA_STATE_KEY,
  PROMPT_TOOLBAR_STATE_KEY,
  WORKSPACE_ACTIONS_KEY,
  createEmptyPromptState,
  createEmptyWorkspaceActions,
} from "@/composables/chat/chatActionContext";

const promptState = inject(PROMPT_STATE_KEY, computed(createEmptyPromptState));
const workspaceActions = inject(
  WORKSPACE_ACTIONS_KEY,
  createEmptyWorkspaceActions()
);
const props = reactive({
  get disabled() {
    return promptState.value.disabled;
  },
  get generating() {
    return promptState.value.generating;
  },
  get floating() {
    return promptState.value.floating;
  },
  get showHelp() {
    return promptState.value.showHelp;
  },
  get placeholder() {
    return promptState.value.placeholder;
  },
  get modelValue() {
    return promptState.value.selectedModel;
  },
  get models() {
    return promptState.value.models;
  },
  get modelReadonly() {
    return promptState.value.modelReadonly;
  },
});

const emit = defineEmits(["blur", "expanded-change"]);

function handleComposerEvent(eventName, payload) {
  if (eventName === "submit") {
    workspaceActions.submit(payload);
    return;
  }
  if (eventName === "update:modelValue") {
    workspaceActions.updateSelectedModel(payload);
    return;
  }
  if (eventName === "focus") {
    workspaceActions.handlePromptFocus();
    return;
  }
  if (eventName === "height-change") {
    workspaceActions.handlePromptResize();
    return;
  }
  if (eventName === "blur") {
    emit("blur", payload);
  }
}

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
  isPromptExpanded,
  togglePromptExpanded,
  collapsePromptExpanded,
  isMicEnabled,
  isVoiceListening,
  hasVoiceStopped,
  isSpeechSupported,
  currentModels,
  currentModel,
  tools,
  selectedTemplateTool,
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
} = usePromptComposer(props, handleComposerEvent);

const floating = computed(() => props.floating);
const showHelp = computed(() => props.showHelp);
const placeholder = computed(() => props.placeholder);
const modelValue = computed(() => props.modelValue);
const promptExpandToggleLabel = computed(() =>
  isPromptExpanded.value ? t("chat.inputCollapse") : t("chat.inputExpand")
);

watch(
  isPromptExpanded,
  async (expanded) => {
    if (typeof document !== "undefined") {
      document.body.classList.toggle("prompt-input-expanded", expanded);
    }
    emit("expanded-change", expanded);

    await nextTick();
    workspaceActions.handlePromptResize();
  },
  {flush: "post"}
);

onBeforeUnmount(() => {
  if (typeof document !== "undefined") {
    document.body.classList.remove("prompt-input-expanded");
  }
  emit("expanded-change", false);
});

const resolvedToolbarComponent = computed(() =>
  isMobileSheet.value ? PromptToolbarMobile : PromptToolbarDesktop
);

provide(PROMPT_TEXTAREA_STATE_KEY, {
  text,
  placeholder: computed(() => placeholder.value || t("chat.promptPlaceholder")),
  disabled: computed(() => Boolean(props.disabled)),
  generating: computed(() => Boolean(props.generating)),
  canSubmit,
  expanded: computed(() => Boolean(isPromptExpanded.value)),
});

provide(
  PROMPT_TOOLBAR_STATE_KEY,
  computed(() => ({
    disabled: actionDisabled.value,
    modelReadonly: props.modelReadonly,
    modelValue: props.modelValue,
    currentModel: currentModel.value,
    models: currentModels.value,
    tools: tools.value,
    selectedTemplateTool: selectedTemplateTool.value,
    attachOptions: attachOptions.value,
    modelMenuOpen: modelMenuOpen.value,
    toolMenuOpen: toolMenuOpen.value,
    attachMenuOpen: attachMenuOpen.value,
    isMobileSheet: isMobileSheet.value,
    canSubmit: canSubmit.value,
    hasPromptText: hasPromptText.value,
    isMicEnabled: isMicEnabled.value,
    isVoiceListening: isVoiceListening.value,
    hasVoiceStopped: hasVoiceStopped.value,
    generating: props.generating,
    isSpeechSupported: isSpeechSupported.value,
    voiceStartLabel: t("chat.voiceStart"),
    voiceStopLabel: t("chat.voiceStop"),
    attachLabel: t("chat.attach"),
    sendLabel: t("chat.send"),
    modelSelectLabel: t("chat.modelSelect"),
    readonlyTitle: t("chat.modelReadonly"),
  }))
);

defineExpose({
  setText,
  collapsePromptExpanded,
});
</script>

<style scoped lang="scss">
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
