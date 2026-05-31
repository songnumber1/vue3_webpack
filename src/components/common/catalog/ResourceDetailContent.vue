<template>
  <div :class="['resource-detail-content', 'tw-flex-1 tw-min-h-0', contentClass]">
    <header :class="[headClass, 'tw-flex tw-items-center tw-gap-4']">
      <div
        :class="[
          imageClass,
          'tw-inline-flex tw-h-16 tw-w-16 tw-flex-none tw-items-center tw-justify-center tw-rounded-studio tw-bg-studio-primary tw-text-white tw-font-extrabold',
        ]"
      >{{ imageText }}</div>
      <div class="tw-min-w-0">
        <h2 class="tw-m-0 tw-text-xl tw-font-black tw-leading-tight tw-text-studio-text">{{ title }}</h2>
        <p class="tw-mt-1 tw-mb-0 tw-text-sm tw-leading-relaxed tw-text-studio-muted">{{ meta }}</p>
      </div>
    </header>
    <p v-if="description" :class="[descriptionClass, 'tw-mt-4 tw-mb-0 tw-leading-relaxed tw-text-studio-muted']">{{ description }}</p>

    <h3 class="tw-mt-5 tw-mb-2 tw-text-sm tw-font-black tw-text-studio-text">{{ labels.prompts }}</h3>
    <div :class="[promptGridClass, 'tw-grid tw-grid-cols-2 tw-gap-2.5']">
      <button
        v-for="prompt in prompts"
        :key="prompt"
        class="tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-p-3 tw-text-left tw-text-studio-text"
        type="button"
      >{{ prompt }}</button>
    </div>

    <h3 class="tw-mt-5 tw-mb-2 tw-text-sm tw-font-black tw-text-studio-text">{{ labels.knowledge }}</h3>
    <p :class="[boxClass, 'tw-m-0 tw-leading-relaxed tw-text-studio-muted']">{{ knowledge }}</p>

    <h3 class="tw-mt-5 tw-mb-2 tw-text-sm tw-font-black tw-text-studio-text">{{ labels.scope }}</h3>
    <p :class="[boxClass, 'tw-m-0 tw-leading-relaxed tw-text-studio-muted']">{{ scope }}</p>
  </div>
</template>

<script setup>
/**
 * Shared detail body for catalog-like resources.
 * Studio wraps this component today; MCP can reuse it with different labels/data.
 */
defineProps({
  title: {type: String, required: true},
  meta: {type: String, default: ""},
  description: {type: String, default: ""},
  imageText: {type: String, default: ""},
  prompts: {type: Array, default: () => []},
  knowledge: {type: String, default: ""},
  scope: {type: String, default: ""},
  labels: {
    type: Object,
    default: () => ({prompts: "Prompts", knowledge: "Knowledge", scope: "Scope"}),
  },
  contentClass: {type: [String, Array, Object], default: ""},
  headClass: {type: [String, Array, Object], default: "resource-detail-content__head"},
  imageClass: {type: [String, Array, Object], default: "resource-detail-content__image"},
  descriptionClass: {type: [String, Array, Object], default: "resource-detail-content__description"},
  promptGridClass: {type: [String, Array, Object], default: "resource-detail-content__prompt-grid"},
  boxClass: {type: [String, Array, Object], default: "resource-detail-content__box"},
});
</script>
