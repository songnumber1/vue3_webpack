<template>
  <BaseBottomSheet
    :open="modelOpen"
    :title="resolvedModelTitle"
    @close="$emit('close-model')"
  >
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

  <BaseBottomSheet
    :open="toolOpen"
    :title="toolTitle"
    @close="$emit('close-tool')"
  >
    <button
      v-for="tool in tools"
      :key="tool.id"
      class="bottom-sheet-option bottom-sheet-option--row"
      type="button"
      @click="$emit('apply-tool', tool)"
    >
      <span aria-hidden="true">
        {{ tool.icon }}
      </span>

      <strong>
        {{ tool.label }}
      </strong>
    </button>
  </BaseBottomSheet>

  <BaseBottomSheet
    :open="attachOpen"
    :title="resolvedAttachTitle"
    @close="$emit('close-attach')"
  >
    <button
      v-for="option in attachOptions"
      :key="option.id"
      class="bottom-sheet-option bottom-sheet-option--row"
      type="button"
      @click="$emit('open-file-picker', option.id)"
    >
      <span aria-hidden="true">
        {{ option.icon }}
      </span>

      <strong>
        {{ option.label }}
      </strong>
    </button>
  </BaseBottomSheet>
</template>

<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";

import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";

const {t} = useI18n();

const props = defineProps({
  modelOpen: {
    type: Boolean,
    default: false,
  },

  toolOpen: {
    type: Boolean,
    default: false,
  },

  attachOpen: {
    type: Boolean,
    default: false,
  },

  models: {
    type: Array,
    default: () => [],
  },

  tools: {
    type: Array,
    default: () => [],
  },

  attachOptions: {
    type: Array,
    default: () => [],
  },

  modelValue: {
    type: String,
    default: "",
  },

  toolTitle: {
    type: String,
    default: "Tools",
  },

  modelTitle: {
    type: String,
    default: "",
  },

  attachTitle: {
    type: String,
    default: "",
  },
});

defineEmits([
  "close-model",
  "close-tool",
  "close-attach",
  "select-model",
  "apply-tool",
  "open-file-picker",
]);

const resolvedModelTitle = computed(() => {
  return props.modelTitle || t("prompt.modelSelect");
});

const resolvedAttachTitle = computed(() => {
  return props.attachTitle || t("prompt.attach");
});
</script>

<style scoped>
.bottom-sheet-option-main {
  min-width: 0;
}
</style>
