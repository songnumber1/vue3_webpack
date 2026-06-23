<template>
  <BaseBottomSheet :open="open" :title="title" @close="$emit('close')">
    <button
      v-for="model in models"
      :key="model.id"
      class="bottom-sheet-option tw-flex tw-w-full tw-items-center tw-gap-3 tw-text-left"
      :class="{active: model.id === modelValue}"
      type="button"
      @click="$emit('select-model', model.id)"
    >
      <span
        class="bottom-sheet-option-main tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-items-start tw-text-left"
      >
        <strong>{{ model.label }}</strong>
        <small>{{ model.description }}</small>
      </span>

      <CheckIcon
        v-if="model.id === modelValue"
        class="bottom-sheet-check tw-ml-auto tw-shrink-0"
      />
    </button>
  </BaseBottomSheet>
</template>

<script setup>
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";

defineProps({
  open: {type: Boolean, default: false},
  title: {type: String, default: ""},
  modelValue: {type: String, default: ""},
  models: {type: Array, default: () => []},
});

defineEmits(["close", "select-model"]);
</script>
