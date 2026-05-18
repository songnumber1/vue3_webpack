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

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const {tm} = useI18n();
const items = computed(() => tm("notice.items"));
</script>
