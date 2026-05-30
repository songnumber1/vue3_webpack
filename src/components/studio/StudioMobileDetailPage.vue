<template>
  <article
    class="studio-mobile-page studio-mobile-page--detail"
    :aria-label="t('studio.detail.title')"
  >
    <header class="studio-mobile-page__head studio-mobile-page__head--notice">
      <button
        class="studio-mobile-page__back"
        type="button"
        :aria-label="t('common.back')"
        @click="$emit('close')"
      >
        ‹
      </button>
      <strong>{{ studio.name }}</strong>
      <button
        v-if="studio.isMine"
        class="studio-mobile-page__settings"
        type="button"
        :aria-label="t('studio.detail.settings')"
        :title="t('studio.detail.settings')"
        @click="actionSheetOpen = true"
      >
        <span class="studio-icon studio-icon--settings" aria-hidden="true"></span>
      </button>
      <button
        class="studio-mobile-page__close"
        type="button"
        :aria-label="t('common.close')"
        @click="$emit('close')"
      >
        ×
      </button>
    </header>
    <div ref="contentRef" class="studio-mobile-page__content">
      <StudioDetailContent :studio="studio" />
    </div>

    <BaseBottomSheet
      :open="actionSheetOpen"
      :title="t('studio.detail.settings')"
      overlay-class="studio-detail-action-bottom-sheet"
      initial-snap="content"
      :min-height="220"
      :max-ratio="0.65"
      @close="actionSheetOpen = false"
    >
      <div class="studio-detail-action-sheet__list">
        <button
          class="bottom-sheet-option bottom-sheet-option--row studio-detail-action-sheet__option"
          type="button"
          @click="selectAction('edit')"
        >
          <span aria-hidden="true">✎</span>
          <strong>{{ t('studio.detail.edit') }}</strong>
        </button>
        <button
          class="bottom-sheet-option bottom-sheet-option--row studio-detail-action-sheet__option studio-detail-action-sheet__option--danger"
          type="button"
          @click="selectAction('delete')"
        >
          <span aria-hidden="true">🗑</span>
          <strong>{{ t('studio.detail.delete') }}</strong>
        </button>
      </div>
    </BaseBottomSheet>
  </article>
</template>

<script setup>
import {ref} from "vue";
import {useI18n} from "vue-i18n";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";
import StudioDetailContent from "@/components/studio/StudioDetailContent.vue";
const {t} = useI18n();
const contentRef = ref(null);
useOverlayScrollbar(contentRef, {overflow: {x: "hidden", y: "scroll"}});

const props = defineProps({studio: {type: Object, required: true}});
const emit = defineEmits(["close", "edit", "delete"]);
const actionSheetOpen = ref(false);

function selectAction(action) {
  actionSheetOpen.value = false;
  emit(action, props.studio);
}
</script>
