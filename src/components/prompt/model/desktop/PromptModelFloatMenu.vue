<template>
  <div
    v-if="open"
    class="prompt-popover model-menu prompt-model-menu tw-box-border"
  >
    <button
      v-for="model in models"
      :key="model.id"
      class="model-option"
      :class="{active: model.id === modelValue}"
      type="button"
      @click="$emit('select-model', model.id)"
    >
      <span class="model-option-main tw-min-w-0">
        <strong>{{ model.label }}</strong>
        <small>{{ model.description }}</small>
      </span>
      <CheckIcon v-if="model.id === modelValue" class="option-check" />
    </button>
  </div>
</template>

<script setup>
import CheckIcon from "@/components/icons/CheckIcon.vue";

defineProps({
  open: {type: Boolean, default: false},
  modelValue: {type: String, default: ""},
  models: {type: Array, default: () => []},
});

defineEmits(["select-model"]);
</script>
