<template>
  <div class="flex flex-col gap-4">
    <label class="flex flex-col gap-2 text-sm font-extrabold text-app-text">
      {{ t("studio.basic.image") }}
      <input class="h-11 rounded-ui border border-app-border bg-app-surface px-3 text-sm font-medium text-app-text outline-none placeholder:text-app-subtle focus:border-app-primary" :value="draft.image" :placeholder="t('studio.basic.imagePlaceholder')" @input="updateField('image', $event.target.value)" />
    </label>
    <label class="flex flex-col gap-2 text-sm font-extrabold text-app-text">
      {{ t("studio.basic.category") }}
      <select
        v-if="!isMobile"
        class="h-11 rounded-ui border border-app-border bg-app-surface px-3 text-sm font-bold text-app-text outline-none focus:border-app-primary"
        :value="draft.category"
        @change="updateField('category', $event.target.value)"
      >
        <option
          v-for="category in categoryOptions"
          :key="category.value"
          :value="category.value"
        >
          {{ category.label }}
        </option>
      </select>
      <button v-else class="flex h-11 items-center justify-between rounded-ui border border-app-border bg-app-surface px-3 text-left text-sm font-bold text-app-text" type="button" @click="$emit('open-category')">
        <span>{{ selectedCategoryLabel || t('studio.defaults.selectCategory') }}</span>
        <span class="studio-icon studio-icon--chevron-down" aria-hidden="true"></span>
      </button>
    </label>
    <label class="flex flex-col gap-2 text-sm font-extrabold text-app-text">
      {{ t("studio.basic.name") }}
      <input class="h-11 rounded-ui border border-app-border bg-app-surface px-3 text-sm font-medium text-app-text outline-none placeholder:text-app-subtle focus:border-app-primary" :value="draft.name" :placeholder="t('studio.basic.namePlaceholder')" @input="updateField('name', $event.target.value)" />
    </label>
    <label class="flex flex-col gap-2 text-sm font-extrabold text-app-text">
      {{ t("studio.basic.instruction") }}
      <textarea class="min-h-[120px] resize-y rounded-ui border border-app-border bg-app-surface p-3 text-sm font-medium leading-6 text-app-text outline-none placeholder:text-app-subtle focus:border-app-primary" :value="draft.instruction" rows="5" :placeholder="t('studio.basic.instructionPlaceholder')" @input="updateField('instruction', $event.target.value)" />
    </label>
    <label class="flex flex-col gap-2 text-sm font-extrabold text-app-text">
      {{ t("studio.basic.description") }}
      <textarea class="min-h-[104px] resize-y rounded-ui border border-app-border bg-app-surface p-3 text-sm font-medium leading-6 text-app-text outline-none placeholder:text-app-subtle focus:border-app-primary" :value="draft.description" rows="4" :placeholder="t('studio.basic.descriptionPlaceholder')" @input="updateField('description', $event.target.value)" />
    </label>
    <label v-for="index in 8" :key="index" class="flex flex-col gap-2 text-sm font-extrabold text-app-text">
      {{ t('studio.basic.examplePrompt', {index}) }}
      <input class="h-11 rounded-ui border border-app-border bg-app-surface px-3 text-sm font-medium text-app-text outline-none placeholder:text-app-subtle focus:border-app-primary" :value="draft.prompts[index - 1]" :placeholder="t('studio.basic.examplePrompt', {index})" @input="$emit('update-prompt', index - 1, $event.target.value)" />
    </label>
  </div>
</template>

<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useResponsiveContext} from "@/composables/app/responsiveContext";

const {t} = useI18n();

defineProps({
  draft: {type: Object, required: true},
  selectedCategoryLabel: {type: String, default: ""},
  categoryOptions: {type: Array, default: () => []},
});
const emit = defineEmits(["update-field", "update-prompt", "open-category"]);
const responsiveContext = useResponsiveContext();
const isMobile = computed(() => responsiveContext.value.isMobile);
function updateField(field, value) {
  emit("update-field", field, value);
}
</script>
