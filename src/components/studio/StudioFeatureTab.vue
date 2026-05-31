<template>
  <div class="studio-form-stack studio-feature-tab tw-min-w-0">
    <fieldset class="studio-model-fieldset">
      <legend>{{ t("studio.feature.model") }}</legend>
      <div class="studio-model-grid tw-min-w-0">
        <label
          v-for="model in modelOptions"
          :key="model.value"
          class="studio-check-row studio-model-card"
          :class="{active: selectedModels.includes(model.value)}"
        >
          <input
            :checked="selectedModels.includes(model.value)"
            type="checkbox"
            :value="model.value"
            @change="$emit('toggle-model', model.value)"
          />
          <span>
            <strong>{{ model.label }}</strong>
            <small>{{ model.description }}</small>
          </span>
        </label>
      </div>
    </fieldset>

    <section class="studio-multi-select-field" :aria-label="t('studio.feature.rag')">
      <strong class="studio-field-title">{{ t("studio.feature.rag") }}</strong>
      <StudioMultiSelect
        :model-value="selectedRags"
        :title="t('studio.feature.rag')"
        :options="ragOptions"
        @update:model-value="$emit('update-rags', $event)"
      />
    </section>

    <section class="studio-multi-select-field" :aria-label="t('studio.feature.mcp')">
      <strong class="studio-field-title">{{ t("studio.feature.mcp") }}</strong>
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
