<template>
  <footer
    class="shared-readonly-wrap"
    :class="`shared-readonly-wrap--${variant}`"
    :aria-label="titleText"
  >
    <div class="shared-readonly-box" :class="`shared-readonly-box--${variant}`">
      <span class="shared-readonly-icon" aria-hidden="true">
        <svg v-if="variant === 'deleted-model'" viewBox="0 0 24 24">
          <path
            d="M12 3.5 21 20H3L12 3.5Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linejoin="round"
          />
          <path
            d="M12 9v4.4M12 16.8h.01"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24">
          <path
            d="M7 11.5V8a5 5 0 0 1 10 0v3.5M6.5 11.5h11A1.5 1.5 0 0 1 19 13v6a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19v-6a1.5 1.5 0 0 1 1.5-1.5Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      <span class="shared-readonly-text">
        <strong>{{ titleText }}</strong>
        <span>{{ descriptionText }}</span>
      </span>
    </div>
  </footer>
</template>

<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const props = defineProps({
  variant: {type: String, default: "shared"},
  title: {type: String, default: ""},
  description: {type: String, default: ""},
});

const {t, locale} = useI18n();

const titleText = computed(() => {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (props.title) return props.title;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (props.variant === "deleted-model") {
    // 계산된 결과를 호출부로 반환합니다.
    return locale.value === "ko"
      ? "삭제된 모델입니다."
      : "This model has been deleted.";
  }
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (props.variant === "unavailable-model") {
    // 계산된 결과를 호출부로 반환합니다.
    return locale.value === "ko"
      ? "사용할 수 없는 모델입니다."
      : "This model is unavailable.";
  }
  // 계산된 결과를 호출부로 반환합니다.
  return t("chat.sharedReadonly");
});

const descriptionText = computed(() => {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (props.description) return props.description;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (props.variant === "deleted-model") {
    // 계산된 결과를 호출부로 반환합니다.
    return locale.value === "ko"
      ? "이전 대화 내용은 확인할 수 있지만 새 메시지는 보낼 수 없습니다."
      : "You can view this conversation, but you cannot send new messages.";
  }
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (props.variant === "unavailable-model") {
    // 계산된 결과를 호출부로 반환합니다.
    return locale.value === "ko"
      ? "대화 이력은 열 수 있지만 모델 정보를 찾을 수 없어 새 메시지는 보낼 수 없습니다."
      : "You can view this conversation, but model metadata is missing so new messages are blocked.";
  }
  // 계산된 결과를 호출부로 반환합니다.
  return locale.value === "ko"
    ? "이 화면에서는 메시지를 입력하거나 전송할 수 없습니다."
    : "You cannot send messages from this screen.";
});
</script>
