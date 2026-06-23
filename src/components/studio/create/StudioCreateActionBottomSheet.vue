<template>
  <BaseBottomSheet
    :open="open"
    :title="t('studio.createPage.actionMenu')"
    overlay-class="studio-create-action-bottom-sheet"
    initial-snap="content"
    :min-height="300"
    :max-ratio="0.75"
    @close="$emit('close')"
  >
    <div class="studio-create-action-sheet__list">
      <button
        class="bottom-sheet-option bottom-sheet-option--row studio-create-action-sheet__option"
        type="button"
        @click="$emit('apply')"
      >
        <span class="studio-icon studio-icon--apply" aria-hidden="true"></span>
        <strong>{{ t("studio.createPage.apply") }}</strong>
      </button>
      <button
        class="bottom-sheet-option bottom-sheet-option--row studio-create-action-sheet__option"
        type="button"
        @click="$emit('close')"
      >
        <span class="studio-icon studio-icon--save" aria-hidden="true"></span>
        <strong>{{ t("studio.createPage.save") }}</strong>
      </button>
      <button
        class="bottom-sheet-option bottom-sheet-option--row studio-create-action-sheet__option"
        type="button"
        @click="$emit('close')"
      >
        <span
          class="studio-icon studio-icon--register"
          aria-hidden="true"
        ></span>
        <strong>{{ t("studio.createPage.register") }}</strong>
      </button>
      <button
        class="bottom-sheet-option bottom-sheet-option--row studio-create-action-sheet__option"
        type="button"
        @click="$emit('request-close')"
      >
        <span class="studio-icon studio-icon--close" aria-hidden="true"></span>
        <strong>{{ t("studio.createPage.close") }}</strong>
      </button>
    </div>
  </BaseBottomSheet>
</template>

<script setup>
import {useI18n} from "vue-i18n";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";

const {t} = useI18n();
defineProps({
  open: {type: Boolean, default: false},
});
defineEmits(["close", "apply", "request-close"]);
</script>
