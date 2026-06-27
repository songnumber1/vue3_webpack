<template>
  <div ref="rootRef" class="studio-multi-select tw-relative tw-min-w-0">
    <button
      class="studio-multi-select__trigger tw-flex tw-min-h-[44px] tw-w-full tw-min-w-0 tw-items-center tw-justify-between tw-gap-2 tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-px-3 tw-text-left tw-text-inherit"
      type="button"
      :aria-label="title"
      @click="open = true"
    >
      <span
        v-if="modelValue.length"
        class="studio-multi-select__chips tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-justify-end tw-gap-1.5 tw-overflow-hidden"
      >
        <span
          v-for="item in visibleValues"
          :key="item"
          class="studio-multi-select__chip tw-max-w-[120px] tw-truncate tw-rounded-studio tw-bg-studio-surface-muted tw-px-2 tw-py-1 tw-text-xs tw-font-extrabold tw-text-studio-muted"
          >{{ item }}</span
        >
        <span
          v-if="hiddenCount > 0"
          class="studio-multi-select__chip tw-rounded-studio tw-bg-studio-surface-muted tw-px-2 tw-py-1 tw-text-xs tw-font-extrabold tw-text-studio-muted"
          >+{{ hiddenCount }}</span
        >
      </span>
      <strong
        v-else
        class="studio-multi-select__placeholder tw-min-w-0 tw-flex-1 tw-truncate tw-font-bold tw-text-studio-muted"
        >{{ t("studio.selectedCount", {count: 0}) }}</strong
      >
      <span
        class="studio-icon studio-icon--chevron-down tw-shrink-0 tw-text-studio-muted"
        aria-hidden="true"
      ></span>
    </button>

    <StudioMultiSelectBottomSheet
      v-if="isMobile"
      :open="open"
      :model-value="modelValue"
      :title="title"
      :options="options"
      @close="open = false"
      @toggle="toggle"
    />

    <StudioMultiSelectFloatPanel
      v-else
      :open="open"
      :model-value="modelValue"
      :title="title"
      :options="options"
      @close="open = false"
      @toggle="toggle"
    />
  </div>
</template>

<script setup>
import {computed, ref} from "vue";
import {useOutsideClick} from "@/composables/events/useOutsideClick";
import {useI18n} from "vue-i18n";
import {useResponsiveLayoutStore} from "@/stores/responsiveLayoutStore";
import StudioMultiSelectBottomSheet from "@/components/studio/select/StudioMultiSelectBottomSheet.vue";
import StudioMultiSelectFloatPanel from "@/components/studio/select/StudioMultiSelectFloatPanel.vue";
const {t} = useI18n();
const props = defineProps({
  modelValue: {type: Array, default: () => []},
  title: {type: String, required: true},
  options: {type: Array, default: () => []},
});
const emit = defineEmits(["update:modelValue"]);
const open = ref(false);
const rootRef = ref(null);
const responsiveLayoutStore = useResponsiveLayoutStore();
const isMobile = computed(() => responsiveLayoutStore.isMobile);
const visibleValues = computed(() => props.modelValue.slice(0, 2));
const hiddenCount = computed(() =>
  Math.max(0, props.modelValue.length - visibleValues.value.length)
);

useOutsideClick(rootRef, () => {
  if (!isMobile.value && open.value) {
    open.value = false;
  }
});
function toggle(option) {
  const next = props.modelValue.includes(option)
    ? props.modelValue.filter((item) => item !== option)
    : [...props.modelValue, option];
  emit("update:modelValue", next);
}
</script>
