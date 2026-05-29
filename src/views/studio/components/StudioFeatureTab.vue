<template>
  <div class="studio-form-stack studio-feature-tab">
    <fieldset class="studio-model-fieldset">
      <legend>모델 선택</legend>
      <label v-for="model in modelOptions" :key="model.value" class="studio-check-row studio-model-card">
        <input :checked="selectedModels.includes(model.value)" type="checkbox" :value="model.value" @change="$emit('toggle-model', model.value)" />
        <span>
          <strong>{{ model.label }}</strong>
          <small>{{ model.description }}</small>
        </span>
      </label>
    </fieldset>
    <StudioMultiSelect :model-value="selectedRags" title="RAG 데이터 선택" :options="ragOptions" @update:model-value="$emit('update-rags', $event)" />
    <StudioMultiSelect :model-value="selectedMcps" title="MCP 플러그인 선택" :options="mcpOptions" @update:model-value="$emit('update-mcps', $event)" />
  </div>
</template>

<script setup>
import StudioMultiSelect from "@/views/studio/StudioMultiSelect.vue";

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
