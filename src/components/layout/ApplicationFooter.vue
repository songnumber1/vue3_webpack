<template>
  <footer class="application-footer tw-flex tw-h-[38px] tw-min-h-0 tw-w-full tw-min-w-0 tw-items-center tw-justify-center tw-border-t tw-border-app-sidebarBorder tw-bg-app-chat tw-px-4 tw-text-xs tw-font-bold tw-tracking-[-0.02em] tw-text-app-subtle" :aria-label="t('application.footerLabel')">
    <span>{{ t("application.footerText") }}</span>
  </footer>
</template>

<script setup>
/** PC 전용 application footer입니다. 모바일에서는 Sass에서 숨김 처리됩니다. */
import {useI18n} from "vue-i18n";
const {t} = useI18n();
</script>
