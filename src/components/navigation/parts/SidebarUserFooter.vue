<template>
  <div class="sidebar-user sidebar-user--mobile">
    <button
      class="sidebar-user-profile"
      type="button"
      :aria-label="t('common.settings')"
      @click="$emit('open-settings')"
    >
      <div class="user-avatar">민</div>
      <div class="sidebar-user-main">
        <strong>민우 송</strong><small>{{ t("common.plus") }}</small>
      </div>
    </button>
    <div class="sidebar-user-actions">
      <button
        class="sidebar-user-action"
        type="button"
        :aria-label="t('common.theme')"
        @click="$emit('toggle-theme')"
      >
        <span class="theme-glyph"></span>
      </button>
      <button
        class="sidebar-user-action"
        type="button"
        :aria-label="t('common.playground')"
        :title="t('common.playground')"
        @click="$emit('open-playground')"
      >
        <span class="playground-glyph">▦</span>
      </button>
      <button
        class="sidebar-user-action"
        type="button"
        :aria-label="t('common.swagger')"
        @click="$emit('open-swagger')"
      >
        <SwaggerDocIcon />
      </button>
    </div>
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n";
import SwaggerDocIcon from "@/components/icons/SwaggerDocIcon.vue";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const {t} = useI18n();
defineEmits([
  "open-settings",
  "toggle-theme",
  "open-playground",
  "open-swagger",
]);
</script>
