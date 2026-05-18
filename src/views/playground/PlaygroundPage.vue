<template>
  <main class="playground-page">
    <header class="playground-header">
      <div>
        <p class="playground-eyebrow">UI Playground</p>
        <h1>공통 UI 테스트 공간</h1>
        <p>
          Web/Android 공통 컴포넌트, Overlay, Bottom Sheet, 알림/경고/확인
          팝업을 실제 화면과 분리해서 확인합니다.
        </p>
      </div>
      <div class="playground-header-actions">
        <RouterLink class="playground-link" to="/">홈</RouterLink>
        <RouterLink class="playground-link" to="/swagger">Swagger</RouterLink>
      </div>
    </header>

    <section class="playground-grid">
      <article class="playground-card">
        <span class="playground-card-label">Container</span>
        <h2>AppContainer 통합 확인</h2>
        <p>
          기존 WebLayout/AndroidLayout의 단순 slot wrapper를 AppContainer로
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
            <dt>container</dt>
            <dd>{{ containerMode }}</dd>
          </div>
        </dl>
      </article>

      <article class="playground-card">
        <span class="playground-card-label">Overlay</span>
        <h2>Modal / Full Screen</h2>
        <p>
          공통 Overlay Provider를 통해 데스크톱에서는 모달, 모바일에서는 전체
          화면 패널로 전환되는지 확인합니다.
        </p>
        <div class="playground-actions">
          <button
            class="playground-button"
            type="button"
            @click="noticeOpen = true"
          >
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
        <span class="playground-card-label">Popup</span>
        <h2>알림 / 경고 / 확인 팝업</h2>
        <p>
          실제 서비스에서 공통으로 사용할 알림, 경고, 확인 팝업 샘플입니다.
          내용은 slot으로 교체하고, 버튼 액션은 부모에서 제어합니다.
        </p>
        <div class="playground-actions">
          <button
            class="playground-button"
            type="button"
            @click="openPopup('alert')"
          >
            알림 팝업
          </button>
          <button
            class="playground-button playground-button--secondary"
            type="button"
            @click="openPopup('warning')"
          >
            경고 팝업
          </button>
          <button
            class="playground-button playground-button--secondary"
            type="button"
            @click="openPopup('confirm')"
          >
            확인 팝업
          </button>
        </div>
        <div class="playground-log-list">
          <strong>마지막 팝업 결과</strong><br />
          {{ popupResult }}
        </div>
      </article>

      <article class="playground-card">
        <span class="playground-card-label">Bottom Sheet</span>
        <h2>모바일 Sheet 테스트</h2>
        <p>
          동적 컨텐츠가 들어가는 UI는 slot 기반을 유지하고, 외부에서
          open/close만 제어합니다.
        </p>
        <button
          class="playground-button"
          type="button"
          @click="sheetOpen = true"
        >
          Bottom Sheet 열기
        </button>
      </article>

      <article class="playground-card playground-card--wide">
        <span class="playground-card-label">Navigation</span>
        <h2>진입 경로 확인</h2>
        <p>
          웹 모드에서는 헤더 사용자 메뉴의 하위 아이템, 모바일 모드에서는 좌측
          메뉴 사용자 정보 우측 아이콘으로 이 화면에 접근합니다.
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

    <ResponsiveOverlay
      :open="popupOpen"
      :is-mobile="isMobile"
      mobile-mode="dialog"
      :title="activePopup.title"
      :subtitle="activePopup.subtitle"
      @close="closePopup('닫기 버튼')"
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
            @click="closePopup('취소')"
          >
            취소
          </button>
          <button
            class="playground-button"
            type="button"
            @click="
              closePopup(activePopup.type === 'confirm' ? '확인' : '닫기')
            "
          >
            {{ activePopup.type === "confirm" ? "확인" : "닫기" }}
          </button>
        </div>
      </div>
    </ResponsiveOverlay>

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
import {computed, onBeforeUnmount, onMounted, ref} from "vue";
import {RouterLink} from "vue-router";
import {useI18n} from "vue-i18n";
import {useAppContext} from "@/composables/useAppContext";
import {isAndroidApp} from "@/core/config";
import {MOBILE_BREAKPOINT_PX} from "@/constants/uiTokens";
import AppOverlayProvider from "@/components/overlay/AppOverlayProvider.vue";
import ResponsiveOverlay from "@/components/overlay/ResponsiveOverlay.vue";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";
import NoticeView from "@/views/settings/NoticeView.vue";
import PersonalizationView from "@/views/settings/PersonalizationView.vue";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const {t} = useI18n();
const {appInfo} = useAppContext();
const noticeOpen = ref(false);
const personalizationOpen = ref(false);
const sheetOpen = ref(false);
const popupOpen = ref(false);
const activePopupType = ref("alert");
const popupResult = ref("아직 선택된 팝업 액션이 없습니다.");
const isMobile = ref(false);
const containerMode = computed(() =>
  isAndroidApp(appInfo) ? "mobile" : "web"
);
const sheetItems = ["옵션 A", "옵션 B", "옵션 C"];

const popupSamples = {
  alert: {
    type: "alert",
    icon: "i",
    title: "알림 팝업",
    subtitle: "일반 안내 메시지",
    message: "저장이 완료되었습니다.",
    detail:
      "서비스 공지, 단순 완료 안내, 토스트보다 강조가 필요한 안내에 사용합니다.",
  },
  warning: {
    type: "warning",
    icon: "!",
    title: "경고 팝업",
    subtitle: "주의가 필요한 작업",
    message: "입력값을 다시 확인해 주세요.",
    detail:
      "삭제 전 경고, 세션 만료, 네트워크 오류처럼 사용자의 주의가 필요한 상황에 사용합니다.",
  },
  confirm: {
    type: "confirm",
    icon: "?",
    title: "확인 팝업",
    subtitle: "사용자 선택 필요",
    message: "선택한 대화를 삭제하시겠습니까?",
    detail: "확인/취소처럼 사용자의 명시적인 선택이 필요한 작업에 사용합니다.",
  },
};

const activePopup = computed(() => popupSamples[activePopupType.value]);

/**
 * @description openPopup 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} type - type 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function openPopup(type) {
  activePopupType.value = type;
  popupOpen.value = true;
}

/**
 * @description closePopup 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} action - action 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function closePopup(action) {
  popupOpen.value = false;
  popupResult.value = `${activePopup.value.title} - ${action}`;
}

/**
 * @description syncMobile 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function syncMobile() {
  isMobile.value = Boolean(
    window.matchMedia?.(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`)?.matches ||
    isAndroidApp(appInfo)
  );
}

// Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
onMounted(() => {
  syncMobile();
  window.addEventListener("resize", syncMobile, {passive: true});
});

// Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
onBeforeUnmount(() => window.removeEventListener("resize", syncMobile));
</script>
