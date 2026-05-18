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

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const props = defineProps({open: {type: Boolean, default: false}});
const emit = defineEmits(["close"]);
const {t, locale: currentLocale} = useI18n();
const locale = computed(() => currentLocale.value);

/**
 * @description selectLocale 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} value - value 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function selectLocale(value) {
  setAppLocale(value);
  emit("close");
}

void props;
</script>
