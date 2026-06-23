<template>
  <section class="settings-language-card">
    <button
      class="settings-language-option"
      :class="{active: locale === 'ko'}"
      type="button"
      @click="setAppLocale('ko')"
    >
      <span>{{ t("common.korean") }}</span>
      <span v-if="locale === 'ko'" aria-hidden="true">✓</span>
    </button>
    <button
      class="settings-language-option"
      :class="{active: locale === 'en'}"
      type="button"
      @click="setAppLocale('en')"
    >
      <span>{{ t("common.english") }}</span>
      <span v-if="locale === 'en'" aria-hidden="true">✓</span>
    </button>
  </section>
</template>

<script setup>
import {useI18n} from "vue-i18n";
import {setAppLocale} from "@/i18n/appI18n";

const {t, locale} = useI18n();
</script>
