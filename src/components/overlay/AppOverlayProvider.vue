<template>
  <ResponsiveOverlay
    :open="noticeOpen"
    :title="noticeTitle"
    :subtitle="noticeSubtitle"
    @close="$emit('close-notice')"
  >
    <slot name="notice" />
  </ResponsiveOverlay>

  <ResponsiveOverlay
    :open="privacyOpen"
    :title="privacyTitle"
    :subtitle="privacySubtitle"
    @close="$emit('close-privacy')"
  >
    <slot name="privacy" />
  </ResponsiveOverlay>

  <ResponsiveOverlay
    :open="personalizationOpen"
    :title="personalizationTitle"
    :subtitle="personalizationSubtitle"
    @close="$emit('close-personalization')"
  >
    <slot name="personalization" />
  </ResponsiveOverlay>
</template>

<script setup>
/**
 * @file components/overlay/AppOverlayProvider.vue
 * @description 재사용 UI 컴포넌트입니다. 화면 상태는 상위 props/action에서 받고 내부에서는 렌더와 사용자 이벤트만 처리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import ResponsiveOverlay from "@/components/overlay/ResponsiveOverlay.vue";

defineProps({
  noticeOpen: {type: Boolean, default: false},
  noticeTitle: {type: String, required: true},
  noticeSubtitle: {type: String, default: ""},
  privacyOpen: {type: Boolean, default: false},
  privacyTitle: {type: String, default: ""},
  privacySubtitle: {type: String, default: ""},
  personalizationOpen: {type: Boolean, default: false},
  personalizationTitle: {type: String, required: true},
  personalizationSubtitle: {type: String, default: ""},
});

defineEmits(["close-notice", "close-privacy", "close-personalization"]);
</script>
