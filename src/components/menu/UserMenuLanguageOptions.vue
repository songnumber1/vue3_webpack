<template>
  <div
    v-if="open"
    class="user-menu-language-options tw-mt-1 tw-grid tw-gap-1 tw-rounded-xl tw-bg-app-muted tw-p-1"
  >
    <button
      v-for="option in options"
      :key="option.value"
      class="user-menu-language-option tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-justify-between tw-gap-3 tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-3 tw-py-2.5 tw-text-left tw-text-app-text hover:tw-bg-app-controlHover"
      :class="{active: currentLocale === option.value}"
      type="button"
      @click="$emit('select-locale', option.value)"
    >
      <span>{{ option.label }}</span>
      <CheckIcon v-if="currentLocale === option.value" />
    </button>
  </div>
</template>

<script setup>
import CheckIcon from "@/components/icons/CheckIcon.vue";

defineProps({
  open: {type: Boolean, default: false},
  options: {type: Array, default: () => []},
  currentLocale: {type: String, default: ""},
});

defineEmits(["select-locale"]);
</script>
