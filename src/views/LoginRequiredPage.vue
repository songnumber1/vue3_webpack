<template>
  <main class="auth-required-page" role="main">
    <section class="auth-required-card" aria-labelledby="auth-required-title">
      <div class="auth-required-icon" aria-hidden="true">
        <img :src="authLockIcon" alt="" />
      </div>
      <h1 id="auth-required-title">{{ t("loginRequired.title") }}</h1>
      <p>{{ message }}</p>

      <p v-if="errorMessage" class="auth-required-error">
        {{ errorMessage }}
      </p>

      <button
        type="button"
        class="auth-required-button"
        :disabled="loading"
        @click="tempLogin"
      >
        {{
          loading ? t("loginRequired.loggingIn") : t("loginRequired.tempLogin")
        }}
      </button>

      <button
        type="button"
        class="auth-required-secondary-button"
        :disabled="loading"
        @click="checkLogin"
      >
        {{ t("loginRequired.retrySessionCheck") }}
      </button>
    </section>
  </main>
</template>

<script setup>
import {computed, onMounted, ref} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import {authApiLive} from "@/api/live/authApi.live";
import {useAuthStore} from "@/stores/authStore";
import authLockIcon from "@/assets/img/icons/auth-lock.svg";

const route = useRoute();
const router = useRouter();
const {t} = useI18n();
const authStore = useAuthStore();

const loading = ref(false);
const errorMessage = ref("");

const message = computed(() => {
  const key = `loginRequired.reasons.${route.query.reason}`;
  return t(key, t("loginRequired.reasons.LOGIN_REQUIRED"));
});

const redirectPath = computed(() => {
  const redirect = route.query.redirect;
  return typeof redirect === "string" && redirect ? redirect : "/";
});

async function moveAfterAuthenticated() {
  authStore.resetAuth();
  await router.replace(redirectPath.value || "/");
}

async function checkLogin() {
  errorMessage.value = "";

  try {
    const result = await authApiLive.checkLogin();

    if (!result?.path) {
      await moveAfterAuthenticated();
    }
  } catch (error) {
    errorMessage.value = t("loginRequired.checkFailed");
  }
}

async function tempLogin() {
  loading.value = true;
  errorMessage.value = "";

  try {
    await authApiLive.tempLogin({userId: "temp-user", userName: "임시 사용자"});
    await moveAfterAuthenticated();
  } catch (error) {
    errorMessage.value = t("loginRequired.loginFailed");
  } finally {
    loading.value = false;
  }
}

onMounted(checkLogin);
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
  font-size: var(--text-size-page-title);
  line-height: 1.3;
  font-weight: 700;
}
.auth-required-card p {
  margin: 12px 0 24px;
  font-size: var(--text-size-body-strong);
  line-height: 1.6;
  color: var(--text-secondary, #6b7280);
}
.auth-required-error {
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(220, 38, 38, 0.08);
  color: #b91c1c !important;
}
.auth-required-button,
.auth-required-secondary-button {
  width: 100%;
  min-height: 46px;
  border-radius: 14px;
  font-size: var(--text-size-body-strong);
  font-weight: 700;
  cursor: pointer;
}
.auth-required-button {
  border: 0;
  background: #111827;
  color: #ffffff;
}
.auth-required-secondary-button {
  margin-top: 10px;
  border: 1px solid rgba(17, 24, 39, 0.14);
  background: transparent;
  color: #111827;
}
.auth-required-button:disabled,
.auth-required-secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}
.auth-required-button:active,
.auth-required-secondary-button:active {
  transform: translateY(1px);
}
</style>
