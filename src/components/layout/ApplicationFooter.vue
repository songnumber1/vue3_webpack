<template>
  <footer class="application-footer" :aria-label="t('application.footerLabel')">
    <span>{{ t("application.footerText") }}</span>
  </footer>
</template>

<script setup>
/** PC 전용 application footer입니다. 모바일에서는 Sass에서 숨김 처리됩니다. */
import {useI18n} from "vue-i18n";
const {t} = useI18n();
</script>
