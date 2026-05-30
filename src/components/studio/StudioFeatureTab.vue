<template>
  <div class="flex flex-col gap-5">
    <fieldset class="m-0 rounded-ui border border-app-border bg-app-surface p-4">
      <legend class="px-1 text-sm font-black text-app-text">{{ t("studio.feature.model") }}</legend>
      <div class="grid grid-cols-2 gap-3 mobile:grid-cols-1">
        <label
          v-for="model in modelOptions"
          :key="model.value"
          class="flex cursor-pointer items-start gap-3 rounded-ui border border-app-border bg-app-surface p-3 text-app-text transition hover:border-app-primary"
          :class="selectedModels.includes(model.value) ? 'border-app-primary bg-app-primarySoft' : ''"
        >
          <input
            class="mt-1 h-4 w-4 shrink-0 accent-[var(--primary,#10a37f)]"
            :checked="selectedModels.includes(model.value)"
            type="checkbox"
            :value="model.value"
            @change="$emit('toggle-model', model.value)"
          />
          <span class="flex min-w-0 flex-col gap-1">
            <strong class="text-sm font-black">{{ model.label }}</strong>
            <small class="text-xs leading-5 text-app-subtle">{{ model.description }}</small>
          </span>
        </label>
      </div>
    </fieldset>

    <section class="flex flex-col gap-2" :aria-label="t('studio.feature.rag')">
      <strong class="text-sm font-black text-app-text">{{ t("studio.feature.rag") }}</strong>
      <StudioMultiSelect
        :model-value="selectedRags"
        :title="t('studio.feature.rag')"
        :options="ragOptions"
        @update:model-value="$emit('update-rags', $event)"
      />
    </section>

    <section class="flex flex-col gap-2" :aria-label="t('studio.feature.mcp')">
      <strong class="text-sm font-black text-app-text">{{ t("studio.feature.mcp") }}</strong>
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
