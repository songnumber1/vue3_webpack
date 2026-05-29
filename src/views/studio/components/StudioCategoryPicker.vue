<template>
  <BaseBottomSheet
    v-if="isMobile"
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

  <div v-else-if="open" class="studio-picker-backdrop" @click.self="$emit('close')">
    <section class="studio-picker studio-picker--category" role="dialog" aria-modal="true" :aria-label="t('studio.categorySelect')">
      <header class="studio-picker__head">
        <strong>{{ t('studio.categorySelect') }}</strong>
        <button type="button" :aria-label="t('common.close')" @click="$emit('close')">×</button>
      </header>
      <div class="studio-picker__body">
        <button
          v-for="category in categories"
          :key="category.value"
          class="studio-picker__option"
          :class="{active: selectedValue === category.value}"
          type="button"
          @click="$emit('select', category.value)"
        >
          <span>{{ category.label }}</span>
          <small>{{ category.description }}</small>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import {useResponsiveContext} from "@/composables/app/responsiveContext";

const {t} = useI18n();
defineProps({
  open: {type: Boolean, default: false},
  categories: {type: Array, default: () => []},
  selectedValue: {type: String, default: ""},
});
defineEmits(["close", "select"]);
const responsiveContext = useResponsiveContext();
const isMobile = computed(() => responsiveContext.value.isMobile);
</script>
