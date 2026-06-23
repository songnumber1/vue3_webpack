<template>
  <BaseBottomSheet
    :open="open"
    :title="title"
    overlay-class="studio-multi-select-bottom-sheet"
    initial-snap="content"
    :min-height="320"
    :max-ratio="0.86"
    @close="$emit('close')"
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
          @change="$emit('toggle', option)"
        />
        <span class="bottom-sheet-option-main">
          <strong>{{ option }}</strong>
        </span>
      </label>
    </div>
    <div class="studio-multi-select-sheet__footer">
      <button class="studio-button studio-button--primary" type="button" @click="$emit('close')">
        {{ t("studio.createPage.apply") }}
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
  modelValue: {type: Array, default: () => []},
  title: {type: String, required: true},
  options: {type: Array, default: () => []},
});
defineEmits(["close", "toggle"]);
</script>
