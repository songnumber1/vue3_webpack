<template>
  <div class="studio-form-stack">
    <label>{{ t('studio.basic.image') }}<input :value="draft.image" :placeholder="t('studio.basic.imagePlaceholder')" @input="updateField('image', $event.target.value)" /></label>
    <label class="studio-category-field">
      {{ t('studio.basic.category') }}
      <button class="studio-select-like" type="button" @click="$emit('open-category')">
        <span>{{ selectedCategoryLabel || t('studio.defaults.selectCategory') }}</span>
        <span class="studio-icon studio-icon--chevron-down" aria-hidden="true"></span>
      </button>
    </label>
    <label>{{ t('studio.basic.name') }}<input :value="draft.name" :placeholder="t('studio.basic.namePlaceholder')" @input="updateField('name', $event.target.value)" /></label>
    <label>{{ t('studio.basic.instruction') }}<textarea :value="draft.instruction" rows="5" :placeholder="t('studio.basic.instructionPlaceholder')" @input="updateField('instruction', $event.target.value)" /></label>
    <label>{{ t('studio.basic.description') }}<textarea :value="draft.description" rows="4" :placeholder="t('studio.basic.descriptionPlaceholder')" @input="updateField('description', $event.target.value)" /></label>
    <label v-for="index in 8" :key="index">{{ t('studio.basic.examplePrompt', {index}) }}<input :value="draft.prompts[index - 1]" :placeholder="t('studio.basic.examplePrompt', {index})" @input="$emit('update-prompt', index - 1, $event.target.value)" /></label>
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n";
const {t} = useI18n();

defineProps({
  draft: {type: Object, required: true},
  selectedCategoryLabel: {type: String, default: ""},
});
const emit = defineEmits(["update-field", "update-prompt", "open-category"]);
function updateField(field, value) {
  emit("update-field", field, value);
}
</script>
