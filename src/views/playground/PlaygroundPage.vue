<!--
@file PlaygroundPage.vue
@description UI playground for validating shared shell, overlay, modal, bottom sheet and platform navigation behavior.
-->

<template>
  <main class="playground-page">
    <header class="playground-header">
      <div>
        <p class="playground-eyebrow">UI Playground</p>
        <h1>공통 UI 테스트 공간</h1>
        <p>
          Web/Android 공통 컴포넌트, Overlay, Bottom Sheet, 라우터 이동을 실제
          화면과 분리해서 확인합니다.
        </p>
      </div>
      <div class="playground-header-actions">
        <RouterLink class="playground-link" to="/">홈</RouterLink>
        <RouterLink class="playground-link" to="/swagger">Swagger</RouterLink>
      </div>
    </header>

    <section class="playground-grid">
      <article class="playground-card">
        <span class="playground-card-label">Shell</span>
        <h2>AppShell 통합 확인</h2>
        <p>
          기존 WebLayout/AndroidLayout의 단순 slot wrapper를 AppShell 하나로
          통합하고, platform class로 Web/Android 차이를 분리했습니다.
        </p>
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
            <dt>shell</dt>
            <dd>{{ shellMode }}</dd>
          </div>
        </dl>
      </article>

      <article class="playground-card">
        <span class="playground-card-label">Overlay</span>
        <h2>Modal / Full Screen</h2>
        <p>
          공통 Overlay Provider를 통해 데스크톱에서는 모달, 모바일에서는 전체 화면
          패널로 전환되는지 확인합니다.
        </p>
        <div class="playground-actions">
          <button class="playground-button" type="button" @click="noticeOpen = true">
            공지 Overlay 열기
          </button>
          <button
            class="playground-button playground-button--secondary"
            type="button"
            @click="personalizationOpen = true"
          >
            개인화 Overlay 열기
          </button>
        </div>
      </article>

      <article class="playground-card">
        <span class="playground-card-label">Bottom Sheet</span>
        <h2>모바일 Sheet 테스트</h2>
        <p>
          동적 컨텐츠가 들어가는 UI는 slot 기반을 유지하고, 외부에서 open/close만
          제어합니다.
        </p>
        <button class="playground-button" type="button" @click="sheetOpen = true">
          Bottom Sheet 열기
        </button>
      </article>

      <article class="playground-card playground-card--wide">
        <span class="playground-card-label">Navigation</span>
        <h2>진입 경로 확인</h2>
        <p>
          웹 모드에서는 헤더 사용자 메뉴의 하위 아이템, 모바일 모드에서는 좌측 메뉴
          사용자 정보 우측 아이콘으로 이 화면에 접근합니다.
        </p>
        <div class="playground-route-row">
          <RouterLink to="/guide">Guide route</RouterLink>
          <RouterLink to="/shared/sample-share-id">Shared route</RouterLink>
          <RouterLink to="/chat/1">Chat route</RouterLink>
        </div>
      </article>
    </section>

    <AppOverlayProvider
      :notice-open="noticeOpen"
      :personalization-open="personalizationOpen"
      :is-mobile="isMobile"
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

    <BaseBottomSheet
      :open="sheetOpen"
      title="Playground Bottom Sheet"
      @close="sheetOpen = false"
    >
      <div class="playground-sheet-body">
        <button
          v-for="item in sheetItems"
          :key="item"
          class="bottom-sheet-option"
          type="button"
          @click="sheetOpen = false"
        >
          <strong>{{ item }}</strong>
          <small>동적으로 변경 가능한 slot 컨텐츠입니다.</small>
        </button>
      </div>
    </BaseBottomSheet>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { useI18n } from "vue-i18n";
import { useAppContext } from "@/composables/useAppContext";
import { isAndroidApp } from "@/core/config";
import AppOverlayProvider from "@/components/overlay/AppOverlayProvider.vue";
import BaseBottomSheet from "@/components/chat/BaseBottomSheet.vue";
import NoticeView from "@/views/settings/NoticeView.vue";
import PersonalizationView from "@/views/settings/PersonalizationView.vue";

const { t } = useI18n();
const { appInfo } = useAppContext();
const noticeOpen = ref(false);
const personalizationOpen = ref(false);
const sheetOpen = ref(false);
const isMobile = ref(false);
const shellMode = computed(() => (isAndroidApp(appInfo) ? "mobile" : "web"));
const sheetItems = ["옵션 A", "옵션 B", "옵션 C"];

function syncMobile() {
  isMobile.value = Boolean(
    window.matchMedia?.("(max-width: 900px)")?.matches || isAndroidApp(appInfo),
  );
}

onMounted(() => {
  syncMobile();
  window.addEventListener("resize", syncMobile, { passive: true });
});

onBeforeUnmount(() => window.removeEventListener("resize", syncMobile));
</script>
