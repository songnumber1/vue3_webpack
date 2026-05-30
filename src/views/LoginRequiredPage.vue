<template>
  <main class="flex min-h-screen min-h-[100dvh] items-center justify-center bg-app-bg px-5 py-[max(24px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))] text-app-text" role="main">
    <section class="w-[min(100%,420px)] rounded-3xl border border-app-border bg-app-surface px-6 py-8 text-center shadow-soft" aria-labelledby="auth-required-title">
      <div class="mx-auto mb-[18px] inline-flex size-14 items-center justify-center rounded-[18px] bg-blue-600/10 text-blue-600 [&>svg]:size-[30px] [&>svg]:fill-current" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path
            d="M12 2.75a5.25 5.25 0 0 0-5.25 5.25v2.25H6A2.25 2.25 0 0 0 3.75 12.5v6.25A2.25 2.25 0 0 0 6 21h12a2.25 2.25 0 0 0 2.25-2.25V12.5A2.25 2.25 0 0 0 18 10.25h-.75V8A5.25 5.25 0 0 0 12 2.75Zm3.75 7.5h-7.5V8a3.75 3.75 0 1 1 7.5 0v2.25ZM12 14a1.25 1.25 0 0 1 .75 2.25v1a.75.75 0 0 1-1.5 0v-1A1.25 1.25 0 0 1 12 14Z"
          />
        </svg>
      </div>
      <h1 id="auth-required-title" class="m-0 text-[var(--text-size-page-title)] font-bold leading-[1.3]">{{ t("loginRequired.title") }}</h1>
      <p class="my-3 mb-6 text-[var(--text-size-body-strong)] leading-relaxed text-app-subtle">{{ message }}</p>

      <p v-if="errorMessage" class="rounded-[10px] bg-red-600/10 px-3 py-2 text-red-700">
        {{ errorMessage }}
      </p>

      <button
        type="button"
        class="mt-0 min-h-[46px] w-full cursor-pointer rounded-[14px] border-0 bg-slate-900 text-[var(--text-size-body-strong)] font-bold text-white active:translate-y-px disabled:cursor-not-allowed disabled:opacity-65"
        :disabled="isBusy"
        @click="tempLogin"
      >
        {{
          loading ? t("loginRequired.loggingIn") : t("loginRequired.tempLogin")
        }}
      </button>

      <button
        type="button"
        class="mt-2.5 min-h-[46px] w-full cursor-pointer rounded-[14px] border border-slate-900/15 bg-transparent text-[var(--text-size-body-strong)] font-bold text-slate-900 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-65"
        :disabled="isBusy"
        @click="checkLogin"
      >
        {{ t("loginRequired.retrySessionCheck") }}
      </button>
    </section>
  </main>
</template>

<script setup>
/**
 * @file views/LoginRequiredPage.vue
 * @description 라우터가 직접 렌더하는 페이지 진입 컴포넌트입니다. 대부분 실제 로직은 container에 위임합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, onMounted, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {authApiLive} from "@/api/live/authApi.live";
import {useAuthStore} from "@/stores/authStore";

const route = useRoute();
const router = useRouter();
const {t} = useI18n();
const authStore = useAuthStore();

const loading = ref(false);
const checking = ref(false);
const errorMessage = ref("");
const authFlowId = ref(0);

const isBusy = computed(() => loading.value || checking.value);

const message = computed(() => {
  const key = `loginRequired.reasons.${route.query.reason}`;
  return t(key, t("loginRequired.reasons.LOGIN_REQUIRED"));
});

const redirectPath = computed(() => {
  const redirect = route.query.redirect;
  return typeof redirect === "string" && redirect ? redirect : "/";
});

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
async function moveAfterAuthenticated() {
  authStore.resetAuth();
  await router.replace(redirectPath.value || "/");
}

/**
 * 현재 상태가 특정 조건을 만족하는지 판단합니다.
 */
function isStaleAuthFlow(flowId) {
  return flowId !== authFlowId.value;
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
async function checkLogin() {
  if (isBusy.value) return;

  const flowId = ++authFlowId.value;
  checking.value = true;
  errorMessage.value = "";

  try {
    const result = await authApiLive.checkLogin();

    if (isStaleAuthFlow(flowId)) return;

    if (!result?.path) {
      await moveAfterAuthenticated();
    }
  } catch (error) {
    if (isStaleAuthFlow(flowId)) return;

    errorMessage.value = t("loginRequired.checkFailed");
  } finally {
    if (!isStaleAuthFlow(flowId)) {
      checking.value = false;
    }
  }
}

/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
async function tempLogin() {
  if (isBusy.value) return;

  const flowId = ++authFlowId.value;
  loading.value = true;
  errorMessage.value = "";

  try {
    await authApiLive.tempLogin({userId: "temp-user", userName: "임시 사용자"});

    if (isStaleAuthFlow(flowId)) return;

    await moveAfterAuthenticated();
  } catch (error) {
    if (isStaleAuthFlow(flowId)) return;

    errorMessage.value = t("loginRequired.loginFailed");
  } finally {
    if (!isStaleAuthFlow(flowId)) {
      loading.value = false;
    }
  }
}

onMounted(checkLogin);
</script>
