<!--
@file NoticeView.vue
@description Notice content that can be rendered in desktop modal or mobile full-screen overlay.
-->

<template>
  <div class="notice-view">
    <article
      v-for="item in items"
      :key="`${item.date}-${item.title}`"
      class="notice-card"
    >
      <span>{{ item.date }}</span>
      <h3>{{ item.title }}</h3>
      <p>{{ item.body }}</p>
    </article>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { tm } = useI18n();
const items = computed(() => tm("notice.items"));
</script>
