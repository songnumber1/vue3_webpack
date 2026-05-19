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
    :open="privacyOpen"
    :is-mobile="isMobile"
    :title="privacyTitle"
    :subtitle="privacySubtitle"
    @close="$emit('close-privacy')"
  >
    <slot name="privacy" />
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

defineProps({
  isMobile: {type: Boolean, default: false},
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
