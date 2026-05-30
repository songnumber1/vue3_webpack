<template>
  <div class="studio-multi-select">
    <button class="studio-multi-select__trigger" type="button" :aria-label="title" @click="open = true">
      <span v-if="modelValue.length" class="studio-multi-select__chips">
        <span v-for="item in visibleValues" :key="item" class="studio-multi-select__chip">{{ item }}</span>
        <span v-if="hiddenCount > 0" class="studio-multi-select__chip">+{{ hiddenCount }}</span>
      </span>
      <strong v-else class="studio-multi-select__placeholder">{{ t("studio.selectedCount", {count: 0}) }}</strong>
      <span class="studio-icon studio-icon--chevron-down" aria-hidden="true"></span>
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
        <button class="studio-button studio-button--primary" type="button" @click="open = false">
          {{ t("studio.createPage.apply") }}
        </button>
      </div>
    </BaseBottomSheet>

    <div v-else-if="open" class="studio-multi-select__panel" role="dialog" :aria-label="title">
      <div class="studio-multi-select__list">
        <label v-for="option in options" :key="option" class="studio-multi-select__option">
          <input type="checkbox" :checked="modelValue.includes(option)" @change="toggle(option)" />
          <span>{{ option }}</span>
        </label>
      </div>
      <button class="studio-button studio-button--primary" type="button" @click="open = false">{{ t("studio.createPage.apply") }}</button>
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from "vue";
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
const responsiveContext = useResponsiveContext();
const isMobile = computed(() => responsiveContext.value.isMobile);
const visibleValues = computed(() => props.modelValue.slice(0, 2));
const hiddenCount = computed(() => Math.max(0, props.modelValue.length - visibleValues.value.length));
function toggle(option) {
  const next = props.modelValue.includes(option)
    ? props.modelValue.filter((item) => item !== option)
    : [...props.modelValue, option];
  emit("update:modelValue", next);
}
</script>
