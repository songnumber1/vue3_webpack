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
      @click="
        setAppLocale('ko');
        $emit('close');
      "
    >
      <strong>{{ t("common.korean") }}</strong>
      <small>{{ t("common.koreanUi") }}</small>
    </button>
    <button
      class="bottom-sheet-option"
      :class="{active: locale === 'en'}"
      type="button"
      @click="
        setAppLocale('en');
        $emit('close');
      "
    >
      <strong>{{ t("common.english") }}</strong>
      <small>{{ t("common.englishUi") }}</small>
    </button>
  </BaseBottomSheet>
</template>

<script setup>
/**
 * @file components/menu/LanguageSelectSheet.vue
 * @description 언어/사용자 메뉴 등 전역 메뉴 UI입니다. 선택 이벤트를 store 또는 상위 action에 전달합니다.
 */

import {computed} from "vue";
import {useI18n} from "vue-i18n";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import {setAppLocale} from "@/i18n/appI18n";

/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
const props = defineProps({open: {type: Boolean, default: false}});
defineEmits(["close"]);
const {t, locale: currentLocale} = useI18n();
const locale = computed(() => currentLocale.value);
void props;
</script>
