<template>
  <div class="studio-form-stack studio-feature-tab tw-grid tw-min-w-0 tw-gap-3">
    <fieldset class="studio-model-fieldset tw-m-0 tw-grid tw-min-w-0 tw-gap-2 tw-border-0 tw-bg-transparent tw-p-0">
      <legend class="tw-mb-2 tw-block tw-p-0 tw-text-sm tw-font-extrabold tw-leading-snug tw-text-studio-text">{{ t("studio.feature.model") }}</legend>
      <div class="studio-model-grid tw-grid tw-min-w-0 tw-grid-cols-1 tw-gap-2 tw-border-0 tw-bg-transparent">
        <label
          v-for="model in modelOptions"
          :key="model.value"
          :class="[
            'studio-check-row studio-model-card tw-grid tw-min-h-[56px] tw-min-w-0 tw-cursor-pointer tw-grid-cols-[24px_minmax(0,1fr)] tw-items-center tw-gap-2.5 tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-px-3 tw-py-2.5',
            {
              active: selectedModels.includes(model.value),
              'tw-border-studio-primary tw-bg-studio-primary-soft': selectedModels.includes(model.value),
            },
          ]"
        >
          <input
            :checked="selectedModels.includes(model.value)"
            class="tw-h-[18px] tw-w-[18px] tw-accent-studio-primary"
            type="checkbox"
            :value="model.value"
            @change="$emit('toggle-model', model.value)"
          />
          <span class="tw-grid tw-min-w-0 tw-gap-1">
            <strong class="tw-text-sm tw-font-extrabold tw-leading-snug">{{ model.label }}</strong>
            <small class="tw-text-xs tw-leading-snug tw-text-studio-muted">{{ model.description }}</small>
          </span>
        </label>
      </div>
    </fieldset>

    <section class="studio-multi-select-field tw-grid tw-min-w-0 tw-gap-2" :aria-label="t('studio.feature.rag')">
      <strong class="studio-field-title tw-block tw-text-sm tw-font-extrabold tw-leading-snug tw-text-studio-text">{{ t("studio.feature.rag") }}</strong>
      <StudioMultiSelect
        :model-value="selectedRags"
        :title="t('studio.feature.rag')"
        :options="ragOptions"
        @update:model-value="$emit('update-rags', $event)"
      />
    </section>

    <section class="studio-multi-select-field tw-grid tw-min-w-0 tw-gap-2" :aria-label="t('studio.feature.mcp')">
      <strong class="studio-field-title tw-block tw-text-sm tw-font-extrabold tw-leading-snug tw-text-studio-text">{{ t("studio.feature.mcp") }}</strong>
      <StudioMultiSelect
        :model-value="selectedMcps"
        :title="t('studio.feature.mcp')"
        :options="mcpOptions"
        @update:model-value="$emit('update-mcps', $event)"
      />
    </section>
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n";
import StudioMultiSelect from "@/components/studio/StudioMultiSelect.vue";
const {t} = useI18n();

defineProps({
  modelOptions: {type: Array, default: () => []},
  selectedModels: {type: Array, default: () => []},
  selectedRags: {type: Array, default: () => []},
  selectedMcps: {type: Array, default: () => []},
  ragOptions: {type: Array, default: () => []},
  mcpOptions: {type: Array, default: () => []},
});
defineEmits(["toggle-model", "update-rags", "update-mcps"]);
</script>
