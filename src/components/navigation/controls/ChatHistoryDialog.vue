<template>
  <ResponsiveOverlay
    :open="open"
    :is-mobile="isMobile"
    :title="title"
    mobile-mode="dialog"
    @close="$emit('cancel')"
  >
    <div class="chat-history-dialog">
      <p v-if="message" class="chat-history-dialog__message">{{ message }}</p>
      <label v-if="mode === 'rename'" class="chat-history-dialog__field">
        <span>{{ t("chat.historyDialog.titleField") }}</span>
        <input
          v-model="draftTitle"
          class="chat-history-dialog__input"
          type="text"
          name="chat-title-edit"
          maxlength="80"
          autocomplete="new-password"
          autocapitalize="none"
          autocorrect="off"
          spellcheck="false"
          enterkeyhint="done"
          data-lpignore="true"
          data-form-type="other"
          @keyup.enter="confirm"
        />
      </label>
      <div class="chat-history-dialog__actions">
        <button
          class="playground-button playground-button--secondary"
          type="button"
          @click="$emit('cancel')"
        >
          {{ t("common.cancel") }}
        </button>
        <button class="playground-button" type="button" @click="confirm">
          {{ t("common.confirm") }}
        </button>
      </div>
    </div>
  </ResponsiveOverlay>
</template>

<script setup>
/**
 * @file components/navigation/controls/ChatHistoryDialog.vue
 * @description 좌측 메뉴/드로어 관련 UI입니다. navigation store 상태와 사용자 메뉴 action을 화면에 연결합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import ResponsiveOverlay from "@/components/overlay/ResponsiveOverlay.vue";

const {t} = useI18n();

/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
const props = defineProps({
  open: {type: Boolean, default: false},
  isMobile: {type: Boolean, default: false},
  mode: {type: String, default: "rename"},
  title: {type: String, default: ""},
  message: {type: String, default: ""},
  initialTitle: {type: String, default: ""},
});
const emit = defineEmits(["cancel", "confirm"]);
const draftTitle = ref("");

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function confirm() {
  emit("confirm", props.mode === "rename" ? draftTitle.value.trim() : true);
}

watch(
  () => [props.open, props.initialTitle],
  () => {
    if (props.open) draftTitle.value = props.initialTitle || "";
  },
  {immediate: true}
);
</script>
