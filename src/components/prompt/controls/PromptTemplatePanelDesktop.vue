<template>
  <section
    class="prompt-template-panel tw-mt-0 tw-mb-[2px] tw-w-full tw-border-0 tw-bg-transparent tw-p-0"
    aria-label="Prompt template options"
  >
    <div
      class="prompt-template-desktop-options tw-flex tw-w-full tw-min-w-0 tw-items-center tw-gap-[10px] tw-overflow-x-auto tw-overflow-y-hidden tw-pb-[2px] tw-[scrollbar-width:none] [&::-webkit-scrollbar]:tw-hidden"
    >
      <div
        v-for="group in groups"
        :key="group.id"
        class="prompt-template-group tw-inline-flex tw-min-w-max tw-flex-none tw-items-center tw-gap-[6px]"
      >
        <strong
          class="prompt-template-group-title tw-whitespace-nowrap tw-text-sm tw-font-black tw-leading-[1.2] tw-text-app-text"
          >{{ group.label }}</strong
        >
        <div
          class="prompt-template-chip-row tw-inline-flex tw-min-w-0 tw-items-center tw-gap-1"
        >
          <button
            v-for="option in group.options"
            :key="option.tag"
            class="prompt-template-chip tw-inline-flex tw-min-h-[30px] tw-cursor-pointer tw-items-center tw-justify-center tw-gap-[6px] tw-whitespace-nowrap tw-rounded-[5px] tw-border tw-border-solid tw-px-[9px] tw-py-[5px] tw-font-app tw-text-fixed12 tw-font-extrabold tw-transition-colors tw-duration-fast"
            :class="
              option.active
                ? 'is-active tw-border-[color-mix(in_srgb,var(--accent)_54%,var(--control-border))] tw-bg-[color-mix(in_srgb,var(--accent)_9%,var(--surface))] tw-text-app-accent'
                : 'tw-border-app-controlBorder tw-bg-app-surface tw-text-app-text hover:tw-bg-app-controlHover'
            "
            type="button"
            @click="$emit('select-option', group.id, option.tag)"
          >
            <span>{{ option.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  groups: {type: Array, default: () => []},
});

defineEmits(["select-option"]);
</script>

<style scoped lang="scss"></style>
