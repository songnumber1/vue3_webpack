<template>
  <BaseBottomSheet
    :open="open"
    :title="t('studio.categorySelect')"
    overlay-class="studio-category-bottom-sheet"
    initial-snap="content"
    :min-height="320"
    :max-ratio="0.86"
    @close="$emit('close')"
  >
    <button
      v-for="category in categories"
      :key="category.value"
      class="bottom-sheet-option bottom-sheet-option--row studio-category-sheet-option"
      :class="{active: selectedValue === category.value}"
      type="button"
      @click="$emit('select', category.value)"
    >
      <span class="bottom-sheet-option-main">
        <strong>{{ category.label }}</strong>
        <small>{{ category.description }}</small>
      </span>
      <CheckIcon v-if="selectedValue === category.value" class="bottom-sheet-check" />
    </button>
  </BaseBottomSheet>
</template>

<script setup>
import {useI18n} from "vue-i18n";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";

const {t} = useI18n();
defineProps({
  open: {type: Boolean, default: false},
  categories: {type: Array, default: () => []},
  selectedValue: {type: String, default: ""},
});
defineEmits(["close", "select"]);
</script>
