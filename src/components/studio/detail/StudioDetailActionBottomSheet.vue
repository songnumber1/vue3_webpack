<template>
  <BaseBottomSheet
    :open="open"
    :title="t('studio.detail.settings')"
    overlay-class="studio-detail-action-bottom-sheet"
    initial-snap="content"
    :min-height="220"
    :max-ratio="0.65"
    @close="$emit('close')"
  >
    <div class="studio-detail-action-sheet__list">
      <button
        class="bottom-sheet-option bottom-sheet-option--row studio-detail-action-sheet__option"
        type="button"
        :disabled="disabled"
        @click="$emit('edit')"
      >
        <span aria-hidden="true">✎</span>
        <strong>{{ t("studio.detail.edit") }}</strong>
      </button>
      <button
        class="bottom-sheet-option bottom-sheet-option--row studio-detail-action-sheet__option studio-detail-action-sheet__option--danger"
        type="button"
        :disabled="disabled"
        @click="$emit('delete')"
      >
        <span aria-hidden="true">🗑</span>
        <strong>{{ t("studio.detail.delete") }}</strong>
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
  disabled: {type: Boolean, default: false},
});
defineEmits(["close", "edit", "delete"]);
</script>

<style scoped lang="scss">
:global(.studio-detail-action-bottom-sheet.bottom-sheet-backdrop) {
  z-index: 100010 !important;
}

:global(.studio-detail-action-bottom-sheet.bottom-sheet) {
  z-index: 100020 !important;
}

.studio-detail-action-sheet__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 2px 0 6px;
}

.studio-detail-action-sheet__option {
  min-height: 52px;
}

.studio-detail-action-sheet__option--danger {
  color: #dc2626 !important;
}
</style>
