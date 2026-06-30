<template>
  <PromptAttachmentPreviewList />

  <PromptTemplatePanelMobile v-if="hasSelectedTemplatePanel" />

  <PromptExpandToggle />

  <PromptTextarea ref="textareaComponentRef" />

  <PromptToolbarMobile ref="toolbarRef" />
</template>

<script setup>
/**
 * @file components/prompt/input/PromptInputMobile.vue
 * @description 모바일 전용 PromptComposer 입력 row입니다. 하위 입력 컨트롤은 PromptInput context로 상태/action을 공유합니다.
 */

import {computed, ref} from "vue";
import PromptAttachmentPreviewList from "@/components/prompt/controls/PromptAttachmentPreviewList.vue";
import PromptExpandToggle from "@/components/prompt/controls/PromptExpandToggle.vue";
import PromptTemplatePanelMobile from "@/components/prompt/controls/PromptTemplatePanelMobile.vue";
import PromptTextarea from "@/components/prompt/controls/PromptTextarea.vue";
import PromptToolbarMobile from "@/components/prompt/controls/PromptToolbarMobile.vue";
import {usePromptInputState} from "@/composables/prompt/context/promptInputStateContext";

const promptInputState = usePromptInputState();
const toolbarRef = ref(null);
const textareaComponentRef = ref(null);
const hasSelectedTemplatePanel = computed(() =>
  Boolean(promptInputState.hasSelectedTemplatePanel?.value)
);

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
