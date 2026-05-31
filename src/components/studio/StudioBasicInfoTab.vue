<template>
  <div class="studio-form-stack tw-min-w-0">
    <label>{{ t("studio.basic.image") }}<input :value="draft.image" :placeholder="t('studio.basic.imagePlaceholder')" @input="updateField('image', $event.target.value)" /></label>
    <label class="studio-category-field">
      {{ t("studio.basic.category") }}
      <select
        v-if="!isMobile"
        class="studio-select-like studio-select-native"
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
      <button v-else class="studio-select-like" type="button" @click="$emit('open-category')">
        <span>{{ selectedCategoryLabel || t('studio.defaults.selectCategory') }}</span>
        <span class="studio-icon studio-icon--chevron-down" aria-hidden="true"></span>
      </button>
    </label>
    <label>{{ t("studio.basic.name") }}<input :value="draft.name" :placeholder="t('studio.basic.namePlaceholder')" @input="updateField('name', $event.target.value)" /></label>
    <label>{{ t("studio.basic.instruction") }}<textarea :value="draft.instruction" rows="5" :placeholder="t('studio.basic.instructionPlaceholder')" @input="updateField('instruction', $event.target.value)" /></label>
    <label>{{ t("studio.basic.description") }}<textarea :value="draft.description" rows="4" :placeholder="t('studio.basic.descriptionPlaceholder')" @input="updateField('description', $event.target.value)" /></label>
    <label v-for="index in 8" :key="index">{{ t('studio.basic.examplePrompt', {index}) }}<input :value="draft.prompts[index - 1]" :placeholder="t('studio.basic.examplePrompt', {index})" @input="$emit('update-prompt', index - 1, $event.target.value)" /></label>
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
