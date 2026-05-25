<template>
  <div
    v-if="image"
    class="image-preview-backdrop"
    role="dialog"
    aria-modal="true"
    :aria-label="image.name"
    @click="$emit('close')"
  >
    <button
      type="button"
      class="image-preview-close"
      :aria-label="t('chat.imagePreview.close')"
      @click.stop="$emit('close')"
    >
      ×
    </button>
    <div class="image-preview-stage" @click.stop>
      <div v-if="image.loading" class="image-preview-loading" role="status">
        {{ t("chat.imagePreview.loading") }}
      </div>
      <div v-if="image.error" class="image-preview-error" role="alert">
        {{ t("chat.imagePreview.error") }}
      </div>
      <img
        v-if="image.url && !image.error"
        :key="image.url"
        class="image-preview-large"
        :class="{'image-preview-large--hidden': image.loading}"
        :src="image.url"
        :alt="image.name"
        @load="$emit('load')"
        @error="$emit('error')"
      />
    </div>
  </div>
</template>

<script setup>
/**
 * @file components/chat/ChatImagePreview.vue
 * @description 채팅 UI 컴포넌트입니다. 메시지, 헤더, 입력 영역, 이미지 프리뷰 등 실제 화면 렌더를 담당합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {useI18n} from "vue-i18n";

const {t} = useI18n();

defineProps({
  image: {type: Object, default: null},
});

defineEmits(["close", "load", "error"]);
</script>
