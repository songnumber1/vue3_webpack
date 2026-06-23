<template>
  <div v-if="open" class="studio-picker-backdrop tw-fixed tw-inset-0 tw-z-modal" @click.self="$emit('close')">
    <section
      class="studio-picker studio-picker--category tw-bg-studio-surface tw-text-studio-text"
      role="dialog"
      aria-modal="true"
      :aria-label="t('studio.categorySelect')"
    >
      <header class="studio-picker__head">
        <strong>{{ t("studio.categorySelect") }}</strong>
        <button type="button" :aria-label="t('common.close')" @click="$emit('close')">×</button>
      </header>
      <div ref="pickerBodyRef" class="studio-picker__body tw-min-h-0">
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
import {ref} from "vue";
import {useI18n} from "vue-i18n";
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";

const {t} = useI18n();
const {shouldUseOverlayScrollbar} = useOverlayScrollPolicy();
const pickerBodyRef = ref(null);
defineProps({
  open: {type: Boolean, default: false},
  categories: {type: Array, default: () => []},
  selectedValue: {type: String, default: ""},
});
defineEmits(["close", "select"]);
useOverlayScrollbar(
  pickerBodyRef,
  {overflow: {x: "hidden", y: "scroll"}},
  {enabled: () => shouldUseOverlayScrollbar.value}
);
</script>
