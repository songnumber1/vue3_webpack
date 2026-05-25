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
/**
 * @file views/settings/NoticeView.vue
 * @description 라우터가 직접 렌더하는 페이지 진입 컴포넌트입니다. 대부분 실제 로직은 container에 위임합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed} from "vue";
import {useI18n} from "vue-i18n";

const {tm} = useI18n();
const items = computed(() => tm("notice.items"));
</script>
