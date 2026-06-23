<template>
  <div
    v-if="open"
    class="studio-multi-select__panel tw-absolute tw-left-0 tw-right-0 tw-top-[calc(100%+6px)] tw-z-popover tw-grid tw-gap-2 tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-p-3 tw-shadow-menu"
    role="dialog"
    :aria-label="title"
  >
    <div class="studio-multi-select__list tw-grid tw-gap-1.5">
      <label
        v-for="option in options"
        :key="option"
        class="studio-multi-select__option"
      >
        <input
          type="checkbox"
          :checked="modelValue.includes(option)"
          @change="$emit('toggle', option)"
        />
        <span>{{ option }}</span>
      </label>
    </div>
    <button class="studio-button studio-button--primary" type="button" @click="$emit('close')">
      {{ t("studio.createPage.apply") }}
    </button>
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n";

const {t} = useI18n();
defineProps({
  open: {type: Boolean, default: false},
  modelValue: {type: Array, default: () => []},
  title: {type: String, required: true},
  options: {type: Array, default: () => []},
});
defineEmits(["close", "toggle"]);
</script>
