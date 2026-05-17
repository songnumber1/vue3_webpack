<template>
  <main class="auth-required-page" role="main">
    <section class="auth-required-card" aria-labelledby="auth-required-title">
      <div class="auth-required-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path
            d="M12 2.75a5.25 5.25 0 0 0-5.25 5.25v2.25H6A2.25 2.25 0 0 0 3.75 12.5v6.25A2.25 2.25 0 0 0 6 21h12a2.25 2.25 0 0 0 2.25-2.25V12.5A2.25 2.25 0 0 0 18 10.25h-.75V8A5.25 5.25 0 0 0 12 2.75Zm3.75 7.5h-7.5V8a3.75 3.75 0 1 1 7.5 0v2.25ZM12 14a1.25 1.25 0 0 1 .75 2.25v1a.75.75 0 0 1-1.5 0v-1A1.25 1.25 0 0 1 12 14Z"
          />
        </svg>
      </div>
      <h1 id="auth-required-title">로그인이 필요합니다.</h1>
      <p>{{ message }}</p>
      <button type="button" class="auth-required-button" @click="goHome">
        홈페이지로 이동
      </button>
    </section>
  </main>
</template>

<script setup>
import {computed} from "vue";
import {useRoute, useRouter} from "vue-router";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const route = useRoute();
const router = useRouter();

const reasonMessages = {
  ACCESS_DENIED: "현재 계정으로는 해당 페이지에 접근할 수 없습니다.",
  USER_AGREE_REQUIRED: "서비스 이용 동의가 필요합니다.",
  AUTH_ERROR: "로그인 확인 중 오류가 발생했습니다.",
  LOGIN_REQUIRED: "서비스를 이용하려면 먼저 로그인해 주세요.",
};

const message = computed(
  () => reasonMessages[route.query.reason] || reasonMessages.LOGIN_REQUIRED
);

/**
 * @description goHome 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function goHome() {
  router.replace({path: "/"});
}
</script>

<style scoped>
.auth-required-page {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(24px, env(safe-area-inset-top)) 20px
    max(24px, env(safe-area-inset-bottom));
  background: var(--app-bg, #f7f7f8);
  color: var(--text-primary, #111827);
}

.auth-required-card {
  width: min(100%, 420px);
  padding: 32px 24px;
  border: 1px solid rgba(17, 24, 39, 0.08);
  border-radius: 24px;
  background: var(--surface-primary, #ffffff);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
  text-align: center;
}

.auth-required-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 18px;
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
}

.auth-required-icon svg {
  width: 30px;
  height: 30px;
  fill: currentColor;
}

.auth-required-card h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1.3;
  font-weight: 700;
}

.auth-required-card p {
  margin: 12px 0 24px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary, #6b7280);
}

.auth-required-button {
  width: 100%;
  min-height: 46px;
  border: 0;
  border-radius: 14px;
  background: #111827;
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.auth-required-button:active {
  transform: translateY(1px);
}
</style>
