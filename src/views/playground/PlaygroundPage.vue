<template>
  <main class="playground-page">
    <header class="playground-header">
      <div>
        <p class="playground-eyebrow">{{ t("playground.eyebrow") }}</p>
        <h1>{{ t("playground.title") }}</h1>
        <p>{{ t("playground.description") }}</p>
      </div>
      <div class="playground-header-actions">
        <RouterLink class="playground-link" to="/">
          {{ t("common.home") }}
        </RouterLink>
        <RouterLink class="playground-link" to="/swagger">
          {{ t("common.swagger") }}
        </RouterLink>
      </div>
    </header>

    <section class="playground-grid">
      <article class="playground-card">
        <span class="playground-card-label">
          {{ t("playground.container.label") }}
        </span>
        <h2>{{ t("playground.container.title") }}</h2>
        <p>{{ t("playground.container.description") }}</p>
        <dl class="playground-info-list">
          <div>
            <dt>platform</dt>
            <dd>{{ appInfo.platform || "web" }}</dd>
          </div>
          <div>
            <dt>env</dt>
            <dd>{{ appInfo.env || "browser" }}</dd>
          </div>
          <div>
            <dt>container</dt>
            <dd>{{ containerMode }}</dd>
          </div>
          <div>
            <dt>compact</dt>
            <dd>{{ isCompactViewport ? "true" : "false" }}</dd>
          </div>
          <div>
            <dt>native</dt>
            <dd>{{ isNativeRuntime ? "true" : "false" }}</dd>
          </div>
          <div>
            <dt>android</dt>
            <dd>{{ isAndroidRuntime ? "true" : "false" }}</dd>
          </div>
          <div>
            <dt>mobile browser</dt>
            <dd>{{ isMobileBrowser ? "true" : "false" }}</dd>
          </div>
        </dl>
      </article>

      <article class="playground-card">
        <span class="playground-card-label">
          {{ t("playground.overlay.label") }}
        </span>
        <h2>{{ t("playground.overlay.title") }}</h2>
        <p>{{ t("playground.overlay.description") }}</p>
        <div class="playground-actions">
          <button
            class="playground-button"
            type="button"
            @click="noticeOpen = true"
          >
            {{ t("playground.overlay.openNotice") }}
          </button>
          <button
            class="playground-button playground-button--secondary"
            type="button"
            @click="personalizationOpen = true"
          >
            {{ t("playground.overlay.openPersonalization") }}
          </button>
        </div>
      </article>

      <article class="playground-card">
        <span class="playground-card-label">
          {{ t("playground.popup.label") }}
        </span>
        <h2>{{ t("playground.popup.title") }}</h2>
        <p>{{ t("playground.popup.description") }}</p>
        <div class="playground-actions">
          <button
            class="playground-button"
            type="button"
            @click="openPopup('alert')"
          >
            {{ t("playground.popup.alertButton") }}
          </button>
          <button
            class="playground-button playground-button--secondary"
            type="button"
            @click="openPopup('warning')"
          >
            {{ t("playground.popup.warningButton") }}
          </button>
          <button
            class="playground-button playground-button--secondary"
            type="button"
            @click="openPopup('confirm')"
          >
            {{ t("playground.popup.confirmButton") }}
          </button>
        </div>
        <div class="playground-log-list">
          <strong>{{ t("playground.popup.lastResult") }}</strong
          ><br />
          {{ popupResult }}
        </div>
      </article>

      <article class="playground-card">
        <span class="playground-card-label">
          {{ t("playground.clipboard.label") }}
        </span>
        <h2>{{ t("playground.clipboard.title") }}</h2>
        <p>{{ t("playground.clipboard.description") }}</p>
        <div class="playground-actions">
          <button
            class="playground-button"
            type="button"
            @click="copySampleText"
          >
            {{ t("playground.clipboard.copyButton") }}
          </button>
        </div>
        <div class="playground-log-list">
          <strong>{{ t("playground.clipboard.feedbackTarget") }}</strong
          ><br />
          {{ clipboardFeedbackTarget }}
        </div>
      </article>

      <article class="playground-card">
        <span class="playground-card-label">
          {{ t("playground.toast.label") }}
        </span>
        <h2>{{ t("playground.toast.title") }}</h2>
        <p>{{ t("playground.toast.description") }}</p>
        <label class="playground-toast-field">
          <span>{{ t("playground.toast.inputLabel") }}</span>
          <input
            v-model="toastMessage"
            class="playground-toast-input"
            type="text"
            :placeholder="t('playground.toast.placeholder')"
          />
        </label>
        <div class="playground-actions">
          <button
            class="playground-button"
            type="button"
            @click="showToastMessage"
          >
            {{ t("playground.toast.showButton") }}
          </button>
        </div>
        <div class="playground-log-list">
          <strong>{{ t("playground.toast.feedbackTarget") }}</strong
          ><br />
          {{ toastFeedbackTarget }}
        </div>
      </article>

      <article class="playground-card">
        <span class="playground-card-label">
          {{ t("playground.bottomSheet.label") }}
        </span>
        <h2>{{ t("playground.bottomSheet.title") }}</h2>
        <p>{{ t("playground.bottomSheet.description") }}</p>
        <button
          class="playground-button"
          type="button"
          @click="sheetOpen = true"
        >
          {{ t("playground.bottomSheet.open") }}
        </button>
      </article>

      <article class="playground-card playground-card--wide">
        <span class="playground-card-label">
          {{ t("playground.navigation.label") }}
        </span>
        <h2>{{ t("playground.navigation.title") }}</h2>
        <p>{{ t("playground.navigation.description") }}</p>
        <div class="playground-route-row">
          <RouterLink to="/guide">{{
            t("playground.navigation.guideRoute")
          }}</RouterLink>
          <RouterLink to="/shared/sample-share-id">{{
            t("playground.navigation.sharedRoute")
          }}</RouterLink>
          <RouterLink to="/chat/1">{{
            t("playground.navigation.chatRoute")
          }}</RouterLink>
        </div>
      </article>
    </section>

    <AppOverlayProvider
      :notice-open="noticeOpen"
      :personalization-open="personalizationOpen"
      :notice-title="t('notice.title')"
      :notice-subtitle="t('notice.subtitle')"
      :personalization-title="t('personalization.title')"
      :personalization-subtitle="t('personalization.subtitle')"
      @close-notice="noticeOpen = false"
      @close-personalization="personalizationOpen = false"
    >
      <template #notice>
        <NoticeView />
      </template>
      <template #personalization>
        <PersonalizationView />
      </template>
    </AppOverlayProvider>

    <ResponsiveOverlay
      :open="popupOpen"
      mobile-mode="dialog"
      :title="activePopup.title"
      :subtitle="activePopup.subtitle"
      @close="closePopup(t('common.close'))"
    >
      <div class="playground-popup-content">
        <div class="playground-popup-icon" aria-hidden="true">
          {{ activePopup.icon }}
        </div>
        <p class="playground-popup-message">
          {{ activePopup.message }}
        </p>
        <p class="playground-popup-detail">
          {{ activePopup.detail }}
        </p>
        <div class="playground-dialog-actions">
          <button
            v-if="activePopup.type === 'confirm'"
            class="playground-button playground-button--secondary"
            type="button"
            @click="closePopup(t('common.cancel'))"
          >
            {{ t("common.cancel") }}
          </button>
          <button
            class="playground-button"
            type="button"
            @click="
              closePopup(
                activePopup.type === 'confirm'
                  ? t('common.confirm')
                  : t('common.close')
              )
            "
          >
            {{
              activePopup.type === "confirm"
                ? t("common.confirm")
                : t("common.close")
            }}
          </button>
        </div>
      </div>
    </ResponsiveOverlay>

    <BaseBottomSheet
      :open="sheetOpen"
      :title="t('playground.bottomSheet.sheetTitle')"
      @close="sheetOpen = false"
    >
      <div class="playground-sheet-body">
        <button
          v-for="item in sheetItems"
          :key="item.id"
          class="bottom-sheet-option"
          type="button"
          @click="sheetOpen = false"
        >
          <strong>{{ item.title }}</strong>
          <small>{{ t("playground.bottomSheet.optionDescription") }}</small>
        </button>
      </div>
    </BaseBottomSheet>
  </main>
</template>

<script setup>
/**
 * @file views/playground/PlaygroundPage.vue
 * @description 라우터가 직접 렌더하는 페이지 진입 컴포넌트입니다. 대부분 실제 로직은 container에 위임합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, ref} from "vue";
import {RouterLink} from "vue-router";
import {useI18n} from "vue-i18n";
import {useAppContext} from "@/composables/app/useAppContext";
import {useRuntimeModeFlags} from "@/composables/app/useRuntimeModeFlags";
import {
  copyClipboardByPlatform,
  showToastByPlatform,
} from "@/platform/bridge/platformBridge";
import AppOverlayProvider from "@/components/overlay/AppOverlayProvider.vue";
import ResponsiveOverlay from "@/components/overlay/ResponsiveOverlay.vue";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import NoticeView from "@/views/settings/NoticeView.vue";
import PersonalizationView from "@/views/settings/PersonalizationView.vue";

const {t} = useI18n();
const {appInfo} = useAppContext();
const {
  isCompactViewport,
  isNativeRuntime,
  isAndroidApp: isAndroidRuntime,
  isMobileBrowser,
} = useRuntimeModeFlags();
const noticeOpen = ref(false);
const personalizationOpen = ref(false);
const sheetOpen = ref(false);
const popupOpen = ref(false);
const activePopupType = ref("alert");
const popupResult = ref(t("playground.popup.emptyResult"));
const toastMessage = ref(t("playground.toast.sampleText"));

const containerMode = computed(() =>
  isAndroidRuntime.value ? "mobile" : "web"
);
const clipboardFeedbackTarget = computed(() => {
  if (isAndroidRuntime.value) return t("playground.clipboard.androidTarget");
  if (isMobileBrowser.value) return t("playground.clipboard.mobileTarget");

  return t("playground.clipboard.webTarget");
});
const toastFeedbackTarget = computed(() => {
  if (isAndroidRuntime.value) return t("playground.toast.androidTarget");
  if (isMobileBrowser.value) return t("playground.toast.mobileTarget");

  return t("playground.toast.webTarget");
});
const sheetItems = computed(() => [
  {id: "a", title: t("playground.bottomSheet.optionA")},
  {id: "b", title: t("playground.bottomSheet.optionB")},
  {id: "c", title: t("playground.bottomSheet.optionC")},
]);

const popupSamples = computed(() => ({
  alert: {
    type: "alert",
    icon: "i",
    title: t("playground.popup.alert.title"),
    subtitle: t("playground.popup.alert.subtitle"),
    message: t("playground.popup.alert.message"),
    detail: t("playground.popup.alert.detail"),
  },
  warning: {
    type: "warning",
    icon: "!",
    title: t("playground.popup.warning.title"),
    subtitle: t("playground.popup.warning.subtitle"),
    message: t("playground.popup.warning.message"),
    detail: t("playground.popup.warning.detail"),
  },
  confirm: {
    type: "confirm",
    icon: "?",
    title: t("playground.popup.confirm.title"),
    subtitle: t("playground.popup.confirm.subtitle"),
    message: t("playground.popup.confirm.message"),
    detail: t("playground.popup.confirm.detail"),
  },
}));

const activePopup = computed(() => popupSamples.value[activePopupType.value]);
/**
 * 관련 modal, sheet, menu, overlay 상태를 열림 상태로 전환합니다.
 */
function openPopup(type) {
  activePopupType.value = type;
  popupOpen.value = true;
}
/**
 * 관련 modal, sheet, menu, overlay 상태를 닫힘 상태로 전환합니다.
 */
function closePopup(action) {
  popupOpen.value = false;
  popupResult.value = t("playground.popup.result", {
    title: activePopup.value.title,
    action,
  });
}
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
async function copySampleText() {
  await copyClipboardByPlatform(t("playground.clipboard.sampleText"));
}
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
async function showToastMessage() {
  await showToastByPlatform(toastMessage.value, {
    title: t("playground.toast.noteTitle"),
  });
}
</script>
