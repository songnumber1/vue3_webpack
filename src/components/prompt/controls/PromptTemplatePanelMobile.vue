<template>
  <section
    class="prompt-template-panel prompt-template-panel--mobile tw-mt-0 tw-mb-[2px] tw-w-full tw-border-0 tw-bg-transparent tw-p-0"
    aria-label="Prompt template options"
  >
    <div
      class="prompt-template-mobile-options tw-flex tw-w-full tw-min-w-0 tw-items-center tw-gap-2 tw-overflow-x-auto tw-overflow-y-hidden tw-pb-[2px] tw-[scrollbar-width:none] [&::-webkit-scrollbar]:tw-hidden"
    >
      <div
        v-for="group in groups"
        :key="group.id"
        class="prompt-template-mobile-group tw-inline-flex tw-min-w-0 tw-flex-none tw-items-center tw-gap-[5px]"
      >
        <span
          class="prompt-template-mobile-title tw-whitespace-nowrap tw-text-sm tw-font-black tw-leading-[1.2] tw-text-app-text"
          >{{ group.label }}</span
        >
        <button
          class="prompt-template-mobile-chip tw-inline-flex tw-min-h-8 tw-flex-none tw-cursor-pointer tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-[5px] tw-border tw-border-solid tw-border-app-controlBorder tw-bg-app-surface tw-px-[10px] tw-py-[6px] tw-font-app tw-text-sm tw-font-extrabold tw-leading-[1.2] tw-text-app-text"
          type="button"
          :aria-label="`${group.label}: ${group.selectedLabel}`"
          @click="$emit('open-mobile-group', group.id)"
        >
          <span>{{ group.selectedLabel }}</span>
        </button>
      </div>
    </div>

    <PromptTemplateOptionBottomSheet
      :group="activeMobileGroup"
      :is-option-active="isOptionActive"
      @select-option="(...args) => $emit('select-option', ...args)"
      @close="$emit('close-mobile-group')"
    />
  </section>
</template>

<script setup>
import PromptTemplateOptionBottomSheet from "@/components/prompt/controls/PromptTemplateOptionBottomSheet.vue";

defineProps({
  groups: {type: Array, default: () => []},
  activeMobileGroup: {type: Object, default: null},
  isOptionActive: {type: Function, required: true},
});

defineEmits(["select-option", "open-mobile-group", "close-mobile-group"]);
</script>

<style scoped lang="scss"></style>
