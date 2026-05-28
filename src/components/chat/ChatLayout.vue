<template>
  <div
    class="chat-container chat-container-root"
    :class="{
      'chat-container-root--keyboard-open': keyboardOpen,
      [`chat-container-root--mode-${mode}`]: true,
      'chat-container-root--sidebar-collapsed': sidebarCollapsed,
    }"
  >
    <AppSidebar />

    <main class="chat-workspace">
      <slot />
    </main>
  </div>
</template>

<script setup>
/**
 * @file components/chat/ChatLayout.vue
 * @description 채팅 UI 컴포넌트입니다. 메시지, 헤더, 입력 영역, 이미지 프리뷰 등 실제 화면 렌더를 담당합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {storeToRefs} from "pinia";
import AppSidebar from "@/components/navigation/AppSidebar.vue";
import {useNavigationStore} from "@/stores/navigationStore";

const navigationStore = useNavigationStore();
const {sidebarCollapsed} = storeToRefs(navigationStore);

defineProps({
  keyboardOpen: {type: Boolean, default: false},
  mode: {type: String, default: "main"},
});

</script>

<style scoped lang="scss">
.chat-layout {
  min-width: 0;
  min-height: 0;
}
</style>
