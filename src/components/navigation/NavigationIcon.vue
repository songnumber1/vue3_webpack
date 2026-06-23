<template>
  <img v-if="bare" class="nav-icon" :src="iconSrc" alt="" aria-hidden="true" />
  <span v-else class="icon-wrap">
    <img class="nav-icon" :src="iconSrc" alt="" aria-hidden="true" />
  </span>
</template>

<script setup>
/**
 * @file components/navigation/NavigationIcon.vue
 * @description 좌측 메뉴/드로어 관련 UI입니다. navigation store 상태와 사용자 메뉴 action을 화면에 연결합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed} from "vue";
import pencilIcon from "@/assets/img/navigation/pencil.svg";
import searchIcon from "@/assets/img/navigation/search.svg";
import panelIcon from "@/assets/img/navigation/panel.svg";
import chatIcon from "@/assets/img/navigation/chat.svg";

const ICONS = {
  pencil: pencilIcon,
  search: searchIcon,
  panel: panelIcon,
  chat: chatIcon,
};

/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
const props = defineProps({
  name: {type: String, required: true},
  bare: {type: Boolean, default: false},
});

const iconSrc = computed(() => ICONS[props.name] || ICONS.chat);
</script>
