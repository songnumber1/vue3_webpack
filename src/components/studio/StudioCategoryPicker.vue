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
      class="flex min-h-[56px] w-full items-center gap-3 rounded-ui px-3 text-left hover:bg-app-hover"
      :class="selectedValue === category.value ? 'bg-app-primarySoft text-app-primary' : 'text-app-text'"
      type="button"
      @click="$emit('select', category.value)"
    >
      <span class="flex min-w-0 flex-1 flex-col gap-1">
        <strong class="text-sm font-black">{{ category.label }}</strong>
        <small class="text-xs leading-5 text-app-subtle">{{ category.description }}</small>
      </span>
      <CheckIcon v-if="selectedValue === category.value" class="h-5 w-5 shrink-0" />
    </button>
  </BaseBottomSheet>

  <div v-else-if="open" class="fixed inset-0 z-overlay flex items-center justify-center bg-black/35 p-6" @click.self="$emit('close')">
    <section class="flex max-h-[80vh] w-full max-w-[460px] flex-col overflow-hidden rounded-ui border border-app-border bg-app-surface shadow-soft" role="dialog" aria-modal="true" :aria-label="t('studio.categorySelect')">
      <header class="flex min-h-[52px] shrink-0 items-center justify-between border-b border-app-border px-4">
        <strong class="text-base font-black text-app-text">{{ t('studio.categorySelect') }}</strong>
        <button class="flex h-9 w-9 items-center justify-center rounded-ui text-xl text-app-subtle hover:bg-app-hover" type="button" :aria-label="t('common.close')" @click="$emit('close')">×</button>
      </header>
      <div ref="pickerBodyRef" class="studio-scrollbar-stable min-h-0 flex-1 overflow-y-auto p-2">
        <button
          v-for="category in categories"
          :key="category.value"
          class="flex w-full flex-col gap-1 rounded-ui px-3 py-3 text-left hover:bg-app-hover"
          :class="selectedValue === category.value ? 'bg-app-primarySoft text-app-primary' : 'text-app-text'"
          type="button"
          @click="$emit('select', category.value)"
        >
          <span class="text-sm font-black">{{ category.label }}</span>
          <small class="text-xs leading-5 text-app-subtle">{{ category.description }}</small>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import {useResponsiveContext} from "@/composables/app/responsiveContext";
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";

const {t} = useI18n();
const pickerBodyRef = ref(null);
defineProps({
  open: {type: Boolean, default: false},
  categories: {type: Array, default: () => []},
  selectedValue: {type: String, default: ""},
});
defineEmits(["close", "select"]);
const responsiveContext = useResponsiveContext();
const isMobile = computed(() => responsiveContext.value.isMobile);
useOverlayScrollbar(
  pickerBodyRef,
  {overflow: {x: "hidden", y: "scroll"}},
  {watchSource: () => [isMobile.value]}
);
</script>
