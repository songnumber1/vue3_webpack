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
/**
 * @file components/menu/LanguageSheet.vue
 * @description 언어/사용자 메뉴 등 전역 메뉴 UI입니다. 선택 이벤트를 store 또는 상위 action에 전달합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed} from "vue";
import {useI18n} from "vue-i18n";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import {setAppLocale} from "@/i18n";

/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
const props = defineProps({open: {type: Boolean, default: false}});
defineEmits(["close"]);
const {t, locale: currentLocale} = useI18n();
const locale = computed(() => currentLocale.value);
void props;
</script>
