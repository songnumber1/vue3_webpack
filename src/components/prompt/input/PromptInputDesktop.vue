<template>
  <PromptTemplatePanelDesktop
    v-if="hasSelectedTemplatePanel"
    :groups="selectedTemplateGroups"
    @select-option="$emit('select-option', $event)"
  />

  <div
    class="prompt-desktop-top-row tw-flex tw-min-w-0 tw-items-center tw-justify-between tw-gap-2"
  >
    <PromptToolbarDesktop
      ref="toolbarRef"
      layout-mode="top-actions"
      class="prompt-toolbar-desktop-top"
      @open-model="$emit('open-model')"
      @open-tool="$emit('open-tool')"
      @close-tool="$emit('close-tool')"
      @open-attach="$emit('open-attach')"
      @select-model="$emit('select-model', $event)"
      @open-file-picker="$emit('open-file-picker', $event)"
    />
    <PromptExpandToggle
      button-class="prompt-expand-toggle--desktop-row"
      :expanded="isPromptExpanded"
      :label="promptExpandToggleLabel"
      @toggle="$emit('toggle-expanded')"
    />
  </div>

  <PromptAttachmentPreviewList
    class="prompt-attachment-preview--desktop-top-actions"
    :attachments="attachments"
    @preview="$emit('preview', $event)"
    @remove="$emit('remove-attachment', $event)"
    @preview-error="$emit('preview-error', $event)"
  />

  <PromptTextarea
    ref="textareaComponentRef"
    @focus="$emit('focus')"
    @blur="$emit('blur')"
    @input="$emit('input', $event)"
    @submit="$emit('submit')"
    @paste="$emit('paste', $event)"
  />

  <PromptSubmitActions
    layout-mode="submit-only"
    class="prompt-toolbar-desktop-submit"
    @start-voice="$emit('start-voice')"
    @stop-voice="$emit('stop-voice')"
  />
</template>

<script setup>
/**
 * @file components/prompt/input/PromptInputDesktop.vue
 * @description PC 전용 PromptComposer 입력 row입니다. PC row DOM을 모바일 row와 분리해 반응형 전환 시 상태 꼬임을 방지합니다.
 */

import {computed, ref} from "vue";
import PromptAttachmentPreviewList from "@/components/prompt/controls/PromptAttachmentPreviewList.vue";
import PromptExpandToggle from "@/components/prompt/controls/PromptExpandToggle.vue";
import PromptSubmitActions from "@/components/prompt/controls/PromptSubmitActions.vue";
import PromptTemplatePanelDesktop from "@/components/prompt/controls/PromptTemplatePanelDesktop.vue";
import PromptTextarea from "@/components/prompt/controls/PromptTextarea.vue";
import PromptToolbarDesktop from "@/components/prompt/controls/PromptToolbarDesktop.vue";

const props = defineProps({
  attachments: {type: Array, default: () => []},
  hasSelectedTemplatePanel: {type: Boolean, default: false},
  selectedTemplateGroups: {type: Array, default: () => []},
  isPromptExpanded: {type: Boolean, default: false},
  promptExpandToggleLabel: {type: String, required: true},
});

void props;

defineEmits([
  "preview",
  "remove-attachment",
  "preview-error",
  "select-option",
  "open-model",
  "open-tool",
  "close-tool",
  "open-attach",
  "select-model",
  "open-file-picker",
  "focus",
  "blur",
  "input",
  "submit",
  "paste",
  "start-voice",
  "stop-voice",
  "toggle-expanded",
]);

const toolbarRef = ref(null);
const textareaComponentRef = ref(null);

const textareaRef = computed(() => {
  const exposed = textareaComponentRef.value;
  return exposed?.textareaRef?.value || exposed?.textareaRef || exposed?.$el || null;
});
const modelRoot = computed(() => toolbarRef.value?.modelRoot?.value || toolbarRef.value?.modelRoot || null);
const toolRoot = computed(() => toolbarRef.value?.toolRoot?.value || toolbarRef.value?.toolRoot || null);
const attachRoot = computed(() => toolbarRef.value?.attachRoot?.value || toolbarRef.value?.attachRoot || null);

defineExpose({textareaRef, modelRoot, toolRoot, attachRoot});
</script>
