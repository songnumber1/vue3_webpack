<template>
  <ResponsiveOverlay
    :open="noticeOpen"
    :is-mobile="isMobile"
    :title="noticeTitle"
    :subtitle="noticeSubtitle"
    @close="$emit('close-notice')"
  >
    <slot name="notice" />
  </ResponsiveOverlay>

  <ResponsiveOverlay
    :open="personalizationOpen"
    :is-mobile="isMobile"
    :title="personalizationTitle"
    :subtitle="personalizationSubtitle"
    @close="$emit('close-personalization')"
  >
    <slot name="personalization" />
  </ResponsiveOverlay>
</template>

<script setup>
import ResponsiveOverlay from "@/components/overlay/ResponsiveOverlay.vue";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
defineProps({
  isMobile: {type: Boolean, default: false},
  noticeOpen: {type: Boolean, default: false},
  noticeTitle: {type: String, required: true},
  noticeSubtitle: {type: String, default: ""},
  personalizationOpen: {type: Boolean, default: false},
  personalizationTitle: {type: String, required: true},
  personalizationSubtitle: {type: String, default: ""},
});

defineEmits(["close-notice", "close-personalization"]);
</script>
