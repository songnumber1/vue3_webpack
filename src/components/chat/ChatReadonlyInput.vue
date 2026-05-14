<!--
@file ChatReadonlyInput.vue
@description Read-only composer replacement used by shared chat routes.
-->

<template>
  <footer class="shared-readonly-wrap" :aria-label="t('chat.sharedReadonly')">
    <div class="shared-readonly-box">
      <strong>{{ t("chat.sharedReadonly") }}</strong>
      <span>{{
        locale === "ko"
          ? "이 화면에서는 메시지를 입력하거나 전송할 수 없습니다."
          : "You cannot send messages from this screen."
      }}</span>
    </div>
  </footer>
</template>

<script setup>
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();
</script>
