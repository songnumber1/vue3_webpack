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
/* Component-local styles should stay scoped. */
</style>
