<template>
  <div ref="rootRef" class="relative">
    <button class="flex min-h-11 w-full items-center justify-between gap-3 rounded-ui border border-app-border bg-app-surface px-3 py-2 text-left text-sm font-bold text-app-text hover:bg-app-hover" type="button" :aria-label="title" @click="open = true">
      <span v-if="modelValue.length" class="flex min-w-0 flex-1 flex-wrap gap-1.5">
        <span v-for="item in visibleValues" :key="item" class="max-w-[160px] truncate rounded-full bg-app-primarySoft px-2 py-1 text-xs font-extrabold text-app-primary">{{ item }}</span>
        <span v-if="hiddenCount > 0" class="rounded-full bg-app-muted px-2 py-1 text-xs font-extrabold text-app-subtle">+{{ hiddenCount }}</span>
      </span>
      <strong v-else class="text-sm font-extrabold text-app-subtle">{{ t("studio.selectedCount", {count: 0}) }}</strong>
      <span class="studio-icon studio-icon--chevron-down text-app-subtle" aria-hidden="true"></span>
    </button>

    <BaseBottomSheet
      v-if="isMobile"
      :open="open"
      :title="title"
      overlay-class="studio-multi-select-bottom-sheet"
      initial-snap="content"
      :max-ratio="0.82"
      @close="open = false"
    >
      <div class="flex max-h-[52vh] flex-col gap-1 overflow-y-auto py-1">
        <label
          v-for="option in options"
          :key="option"
          class="flex min-h-[48px] w-full items-center gap-3 rounded-ui px-3 text-left text-sm font-bold text-app-text hover:bg-app-hover"
          :class="modelValue.includes(option) ? 'bg-app-primarySoft text-app-primary' : ''"
        >
          <input class="h-4 w-4 shrink-0 accent-[var(--primary,#10a37f)]" type="checkbox" :checked="modelValue.includes(option)" @change="toggle(option)" />
          <span class="min-w-0 flex-1 truncate">{{ option }}</span>
        </label>
      </div>
      <div class="border-t border-app-border pt-3">
        <button class="h-11 w-full rounded-ui bg-app-primary px-4 text-sm font-extrabold text-white" type="button" @click="open = false">
          {{ t("studio.createPage.apply") }}
        </button>
      </div>
    </BaseBottomSheet>

    <div v-else-if="open" class="absolute left-0 right-0 top-[calc(100%+6px)] z-overlay rounded-ui border border-app-border bg-app-surface p-2 shadow-soft" role="dialog" :aria-label="title">
      <div class="max-h-[260px] overflow-y-auto pr-1">
        <label v-for="option in options" :key="option" class="flex min-h-[40px] cursor-pointer items-center gap-2 rounded-ui px-2 text-sm font-bold text-app-text hover:bg-app-hover">
          <input class="h-4 w-4 shrink-0 accent-[var(--primary,#10a37f)]" type="checkbox" :checked="modelValue.includes(option)" @change="toggle(option)" />
          <span class="min-w-0 flex-1 truncate">{{ option }}</span>
        </label>
      </div>
      <button class="mt-2 h-10 w-full rounded-ui bg-app-primary px-4 text-sm font-extrabold text-white" type="button" @click="open = false">{{ t("studio.createPage.apply") }}</button>
    </div>
  </div>
</template>

<script setup>
import {computed, onBeforeUnmount, ref} from "vue";
import {useI18n} from "vue-i18n";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import {useResponsiveContext} from "@/composables/app/responsiveContext";
const {t} = useI18n();

const props = defineProps({
  modelValue: {type: Array, default: () => []},
  options: {type: Array, default: () => []},
  title: {type: String, default: ""},
});
const emit = defineEmits(["update:modelValue"]);
const responsiveContext = useResponsiveContext();
const isMobile = computed(() => responsiveContext.value.isMobile);
const open = ref(false);
const rootRef = ref(null);
const visibleValues = computed(() => props.modelValue.slice(0, 2));
const hiddenCount = computed(() => Math.max(0, props.modelValue.length - visibleValues.value.length));

function toggle(option) {
  const next = props.modelValue.includes(option)
    ? props.modelValue.filter((item) => item !== option)
    : [...props.modelValue, option];
  emit("update:modelValue", next);
}

function handleDocumentClick(event) {
  if (!rootRef.value || rootRef.value.contains(event.target)) return;
  open.value = false;
}

document.addEventListener("mousedown", handleDocumentClick);
onBeforeUnmount(() => document.removeEventListener("mousedown", handleDocumentClick));
</script>
