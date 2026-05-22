<template>
  <div ref="modelRoot" class="prompt-selector-wrap">
    <button
      class="prompt-model-trigger"
      type="button"
      :disabled="disabled || modelReadonly"
      :title="modelReadonly ? resolvedReadonlyTitle : undefined"
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
    <div
      v-if="modelMenuOpen && !isMobileSheet"
      class="prompt-popover model-menu prompt-model-menu"
    >
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
</template>

<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import CheckIcon from "@/components/icons/CheckIcon.vue";

const {t} = useI18n();
const modelRoot = ref(null);

const props = defineProps({
  disabled: {type: Boolean, default: false},
  modelReadonly: {type: Boolean, default: false},
  modelValue: {type: String, default: ""},
  currentModel: {type: Object, required: true},
  models: {type: Array, default: () => []},
  modelMenuOpen: {type: Boolean, default: false},
  isMobileSheet: {type: Boolean, default: false},
  modelSelectLabel: {type: String, default: "Select model"},
  readonlyTitle: {type: String, default: ""},
});

defineEmits(["open-model", "select-model"]);

const resolvedReadonlyTitle = computed(
  () => props.readonlyTitle || t("prompt.modelReadonly")
);

defineExpose({modelRoot});
</script>
