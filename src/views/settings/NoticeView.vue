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
import {computed} from "vue";
import {useI18n} from "vue-i18n";

const {tm} = useI18n();
const items = computed(() => tm("notice.items"));
</script>

<style scoped>
/* Scoped layout guard: keep component roots and flex/grid children shrink-safe. */
:where(*) {
  box-sizing: border-box;
  min-width: 0;
}
</style>
