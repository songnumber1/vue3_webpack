<template>
  <PromptAttachmentPreviewList
    :attachments="attachments"
    @preview="$emit('preview', $event)"
    @remove="$emit('remove-attachment', $event)"
    @preview-error="$emit('preview-error', $event)"
  />

  <PromptTemplatePanelMobile
    v-if="hasSelectedTemplatePanel"
    :groups="selectedTemplateGroups"
    :active-mobile-group="activeMobileGroup"
    @select-option="$emit('select-option', $event)"
    @open-mobile-group="$emit('open-mobile-group', $event)"
    @close-mobile-group="$emit('close-mobile-group')"
  />

  <PromptExpandToggle
    :expanded="isPromptExpanded"
    :label="promptExpandToggleLabel"
    @toggle="$emit('toggle-expanded')"
  />

  <PromptTextarea
    ref="textareaComponentRef"
    @focus="$emit('focus')"
    @blur="$emit('blur')"
    @input="$emit('input', $event)"
    @submit="$emit('submit')"
    @paste="$emit('paste', $event)"
  />

  <PromptToolbarMobile
    ref="toolbarRef"
    @open-model="$emit('open-model')"
    @open-tool="$emit('open-tool')"
    @open-attach="$emit('open-attach')"
    @select-model="$emit('select-model', $event)"
    @open-file-picker="$emit('open-file-picker', $event)"
    @start-voice="$emit('start-voice')"
    @stop-voice="$emit('stop-voice')"
  />
</template>

<script setup>
/**
 * @file components/prompt/input/PromptInputMobile.vue
 * @description 모바일 전용 PromptComposer 입력 row입니다. 모바일 row DOM을 PC row와 분리해 전환 후 높이/row 상태를 단순화합니다.
 */

import {computed, ref} from "vue";
import PromptAttachmentPreviewList from "@/components/prompt/controls/PromptAttachmentPreviewList.vue";
import PromptExpandToggle from "@/components/prompt/controls/PromptExpandToggle.vue";
import PromptTemplatePanelMobile from "@/components/prompt/controls/PromptTemplatePanelMobile.vue";
import PromptTextarea from "@/components/prompt/controls/PromptTextarea.vue";
import PromptToolbarMobile from "@/components/prompt/controls/PromptToolbarMobile.vue";

const props = defineProps({
  attachments: {type: Array, default: () => []},
  hasSelectedTemplatePanel: {type: Boolean, default: false},
  selectedTemplateGroups: {type: Array, default: () => []},
  activeMobileGroup: {type: Object, default: null},
  isPromptExpanded: {type: Boolean, default: false},
  promptExpandToggleLabel: {type: String, required: true},
});

void props;

defineEmits([
  "preview",
  "remove-attachment",
  "preview-error",
  "select-option",
  "open-mobile-group",
  "close-mobile-group",
  "open-model",
  "open-tool",
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
  return (
    exposed?.textareaRef?.value || exposed?.textareaRef || exposed?.$el || null
  );
});
const modelRoot = computed(
  () =>
    toolbarRef.value?.modelRoot?.value || toolbarRef.value?.modelRoot || null
);
const toolRoot = computed(
  () => toolbarRef.value?.toolRoot?.value || toolbarRef.value?.toolRoot || null
);
const attachRoot = computed(
  () =>
    toolbarRef.value?.attachRoot?.value || toolbarRef.value?.attachRoot || null
);

function resizeTextarea() {
  return textareaComponentRef.value?.resizeTextarea?.();
}

function resetTextareaAutoGrow() {
  return textareaComponentRef.value?.resetTextareaAutoGrow?.();
}

function getTextareaHeight() {
  return textareaComponentRef.value?.getTextareaHeight?.();
}

function focusTextarea() {
  textareaComponentRef.value?.focusTextarea?.();
}

defineExpose({
  textareaRef,
  modelRoot,
  toolRoot,
  attachRoot,
  resizeTextarea,
  resetTextareaAutoGrow,
  getTextareaHeight,
  focusTextarea,
});
</script>
