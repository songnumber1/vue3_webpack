<template>
  <div class="studio-form-stack studio-feature-tab">
    <fieldset class="studio-model-fieldset">
      <legend>{{ t("studio.feature.model") }}</legend>
      <div class="studio-model-grid">
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
    <StudioMultiSelect
      :model-value="selectedRags"
      :title="t('studio.feature.rag')"
      :options="ragOptions"
      @update:model-value="$emit('update-rags', $event)"
    />
    <StudioMultiSelect
      :model-value="selectedMcps"
      :title="t('studio.feature.mcp')"
      :options="mcpOptions"
      @update:model-value="$emit('update-mcps', $event)"
    />
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
