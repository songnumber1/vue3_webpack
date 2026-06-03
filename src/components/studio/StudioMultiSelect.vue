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

    <BaseBottomSheet
      v-if="isMobile"
      :open="open"
      :title="title"
      overlay-class="studio-multi-select-bottom-sheet"
      initial-snap="content"
      :min-height="320"
      :max-ratio="0.86"
      @close="open = false"
    >
      <div class="studio-multi-select-sheet__list">
        <label
          v-for="option in options"
          :key="option"
          class="bottom-sheet-option bottom-sheet-option--row studio-multi-select-sheet__option"
        >
          <input
            type="checkbox"
            :checked="modelValue.includes(option)"
            @change="toggle(option)"
          />
          <span class="bottom-sheet-option-main">
            <strong>{{ option }}</strong>
          </span>
        </label>
      </div>
      <div class="studio-multi-select-sheet__footer">
        <button
          class="studio-button studio-button--primary"
          type="button"
          @click="open = false"
        >
          {{ t("studio.createPage.apply") }}
        </button>
      </div>
    </BaseBottomSheet>

    <div
      v-else-if="open"
      class="studio-multi-select__panel tw-absolute tw-left-0 tw-right-0 tw-top-[calc(100%+6px)] tw-z-popover tw-grid tw-gap-2 tw-rounded-studio tw-border tw-border-solid tw-border-studio-border tw-bg-studio-surface tw-p-3 tw-shadow-menu"
      role="dialog"
      :aria-label="title"
    >
      <div class="studio-multi-select__list tw-grid tw-gap-1.5">
        <label
          v-for="option in options"
          :key="option"
          class="studio-multi-select__option"
        >
          <input
            type="checkbox"
            :checked="modelValue.includes(option)"
            @change="toggle(option)"
          />
          <span>{{ option }}</span>
        </label>
      </div>
      <button
        class="studio-button studio-button--primary"
        type="button"
        @click="open = false"
      >
        {{ t("studio.createPage.apply") }}
      </button>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from "vue";
import {useOutsideClick} from "@/composables/events/useOutsideClick";
import {useI18n} from "vue-i18n";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import {useResponsiveContext} from "@/composables/app/responsiveContext";
const {t} = useI18n();
const props = defineProps({
  modelValue: {type: Array, default: () => []},
  title: {type: String, required: true},
  options: {type: Array, default: () => []},
});
const emit = defineEmits(["update:modelValue"]);
const open = ref(false);
const rootRef = ref(null);
const responsiveContext = useResponsiveContext();
const isMobile = computed(() => responsiveContext.value.isMobile);
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
