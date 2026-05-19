<template>
  <BaseBottomSheet
    :open="open"
    :title="t('common.language')"
    @close="$emit('close')"
  >
    <button
      class="bottom-sheet-option"
      :class="{active: locale === 'ko'}"
      type="button"
      @click="selectLocale('ko')"
    >
      <strong>{{ t("common.korean") }}</strong>
      <small>한국어 UI</small>
    </button>
    <button
      class="bottom-sheet-option"
      :class="{active: locale === 'en'}"
      type="button"
      @click="selectLocale('en')"
    >
      <strong>{{ t("common.english") }}</strong>
      <small>English UI</small>
    </button>
  </BaseBottomSheet>
</template>

<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import {setAppLocale} from "@/i18n";

const props = defineProps({open: {type: Boolean, default: false}});
const emit = defineEmits(["close"]);
const {t, locale: currentLocale} = useI18n();
const locale = computed(() => currentLocale.value);
function selectLocale(value) {
  setAppLocale(value);
  emit("close");
}

void props;
</script>

<style scoped>
/* Scoped layout guard: keep component roots and flex/grid children shrink-safe. */
:where(*) {
  box-sizing: border-box;
  min-width: 0;
}
</style>
