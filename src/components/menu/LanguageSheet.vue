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
      @click="setAppLocale('ko'); $emit('close')"
    >
      <strong>{{ t("common.korean") }}</strong>
      <small>{{ t("common.koreanUi") }}</small>
    </button>
    <button
      class="bottom-sheet-option"
      :class="{active: locale === 'en'}"
      type="button"
      @click="setAppLocale('en'); $emit('close')"
    >
      <strong>{{ t("common.english") }}</strong>
      <small>{{ t("common.englishUi") }}</small>
    </button>
  </BaseBottomSheet>
</template>

<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import {setAppLocale} from "@/i18n";

const props = defineProps({open: {type: Boolean, default: false}});
defineEmits(["close"]);
const {t, locale: currentLocale} = useI18n();
const locale = computed(() => currentLocale.value);
void props;
</script>
