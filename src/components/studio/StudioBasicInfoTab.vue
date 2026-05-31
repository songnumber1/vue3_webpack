<template>
  <div :class="formStackClass">
    <label :class="fieldClass">{{ t("studio.basic.image") }}<input :class="controlClass" :value="draft.image" :placeholder="t('studio.basic.imagePlaceholder')" @input="updateField('image', $event.target.value)" /></label>
    <label :class="['studio-category-field', fieldClass]">
      {{ t("studio.basic.category") }}
      <select
        v-if="!isMobile"
        :class="['studio-select-like', 'studio-select-native', controlClass]"
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
      <button v-else :class="['studio-select-like', selectLikeClass]" type="button" @click="$emit('open-category')">
        <span>{{ selectedCategoryLabel || t('studio.defaults.selectCategory') }}</span>
        <span class="studio-icon studio-icon--chevron-down" aria-hidden="true"></span>
      </button>
    </label>
    <label :class="fieldClass">{{ t("studio.basic.name") }}<input :class="controlClass" :value="draft.name" :placeholder="t('studio.basic.namePlaceholder')" @input="updateField('name', $event.target.value)" /></label>
    <label :class="fieldClass">{{ t("studio.basic.instruction") }}<textarea :class="textareaClass" :value="draft.instruction" rows="4" :placeholder="t('studio.basic.instructionPlaceholder')" @input="updateField('instruction', $event.target.value)" /></label>
    <label :class="fieldClass">{{ t("studio.basic.description") }}<textarea :class="textareaClass" :value="draft.description" rows="4" :placeholder="t('studio.basic.descriptionPlaceholder')" @input="updateField('description', $event.target.value)" /></label>
    <label v-for="index in 8" :key="index" :class="fieldClass">{{ t('studio.basic.examplePrompt', {index}) }}<input :class="controlClass" :value="draft.prompts[index - 1]" :placeholder="t('studio.basic.examplePrompt', {index})" @input="$emit('update-prompt', index - 1, $event.target.value)" /></label>
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

const formStackClass = "studio-form-stack tw-grid tw-min-w-0 tw-gap-3";
const fieldClass = "tw-grid tw-min-w-0 tw-gap-1.5";
const controlClass = "tw-box-border tw-min-h-[42px] tw-w-full tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-px-3 tw-py-2.5 tw-font-[inherit] tw-text-inherit";
const textareaClass = computed(() => `${controlClass} tw-appearance-none focus:tw-outline-none focus:tw-border-studio-primary ${isMobile.value ? "tw-resize-none" : "tw-resize-y"}`);
const selectLikeClass = `${controlClass} tw-flex tw-items-center tw-justify-between tw-text-left`;
function updateField(field, value) {
  emit("update-field", field, value);
}
</script>
