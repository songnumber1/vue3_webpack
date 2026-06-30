<template>
  <div :class="formStackClass">
    <label :class="fieldClass"
      >{{ t("studio.basic.image")
      }}<input
        :class="controlClass"
        :value="draft.image"
        :placeholder="t('studio.basic.imagePlaceholder')"
        @input="updateField('image', $event.target.value)"
    /></label>
    <label :class="['studio-category-field', fieldClass]">
      {{ t("studio.basic.category") }}
      <button
        :class="['studio-select-like', selectLikeClass]"
        type="button"
        @click="createForm.openCategorySelector?.()"
      >
        <span>{{
          selectedCategoryLabel || t("studio.defaults.selectCategory")
        }}</span>
        <span
          class="studio-icon studio-icon--chevron-down"
          aria-hidden="true"
        ></span>
      </button>
    </label>
    <label :class="fieldClass"
      >{{ t("studio.basic.name")
      }}<input
        :class="controlClass"
        :value="draft.name"
        :placeholder="t('studio.basic.namePlaceholder')"
        @input="updateField('name', $event.target.value)"
    /></label>
    <label :class="fieldClass"
      >{{ t("studio.basic.instruction")
      }}<textarea
        :class="textareaClass"
        :value="draft.instruction"
        rows="4"
        :placeholder="t('studio.basic.instructionPlaceholder')"
        @input="updateField('instruction', $event.target.value)"
      />
    </label>
    <label :class="fieldClass"
      >{{ t("studio.basic.description")
      }}<textarea
        :class="textareaClass"
        :value="draft.description"
        rows="4"
        :placeholder="t('studio.basic.descriptionPlaceholder')"
        @input="updateField('description', $event.target.value)"
      />
    </label>
    <label v-for="index in 8" :key="index" :class="fieldClass"
      >{{ t("studio.basic.examplePrompt", {index})
      }}<input
        :class="controlClass"
        :value="draft.prompts[index - 1]"
        :placeholder="t('studio.basic.examplePrompt', {index})"
        @input="updatePrompt(index - 1, $event.target.value)"
    /></label>
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n";
import {useStudioCreateForm} from "@/composables/studio/context/studioCreateFormContext";

const {t} = useI18n();
const createForm = useStudioCreateForm();
const draft = createForm.draft;
const selectedCategoryLabel = createForm.selectedCategoryLabel;

const formStackClass = "studio-form-stack tw-grid tw-min-w-0 tw-gap-3";
const fieldClass = "tw-grid tw-min-w-0 tw-gap-1.5";
const controlClass =
  "tw-box-border tw-min-h-[42px] tw-w-full tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-px-3 tw-py-2.5 tw-font-[inherit] tw-text-inherit";
const textareaClass = `${controlClass} tw-appearance-none focus:tw-outline-none focus:tw-border-studio-primary tw-resize-none`;
const selectLikeClass = `${controlClass} tw-flex tw-items-center tw-justify-between tw-text-left`;
function updateField(field, value) {
  createForm.updateDraftField?.(field, value);
}
function updatePrompt(index, value) {
  createForm.updateDraftPrompt?.(index, value);
}
</script>
