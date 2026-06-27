<template>
  <teleport to="body">
    <transition :name="isMobile ? 'mobile-page' : 'modal-fade'">
      <div
        v-if="open"
        class="responsive-overlay"
        :class="overlayClasses"
        :data-overlay-mode="overlayMode"
      >
        <div
          v-if="!isMobile"
          class="responsive-overlay-backdrop app-dialog-backdrop"
        ></div>
        <section
          :key="panelRenderKey"
          class="responsive-panel app-dialog-panel"
          :class="panelClass"
          role="dialog"
          aria-modal="true"
          :aria-label="title"
        >
          <header class="responsive-panel-header app-dialog-header">
            <button
              v-if="showMobileBackButton"
              class="responsive-back-button app-dialog-close"
              type="button"
              @click="emit('close')"
            >
              <span aria-hidden="true">‹</span>
              <span class="sr-only">{{ t("common.back") }}</span>
            </button>
            <div>
              <strong>{{ title }}</strong>
              <small v-if="subtitle">{{ subtitle }}</small>
            </div>
            <button
              v-if="showCloseButton"
              class="responsive-close-button app-dialog-close"
              type="button"
              @click="emit('close')"
            >
              ×
            </button>
          </header>
          <div ref="bodyRef" class="responsive-panel-body app-dialog-body">
            <slot />
          </div>
        </section>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
/**
 * @file components/overlay/ResponsiveOverlay.vue
 * @description 재사용 UI 컴포넌트입니다. 화면 상태는 상위 props/action에서 받고 내부에서는 렌더와 사용자 이벤트만 처리합니다.
 */

import {computed, ref, toRef, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useOverlayRegistration} from "@/composables/overlay/useOverlayRegistration";
import {useResponsiveLayoutStore} from "@/stores/responsiveLayoutStore";

const {t} = useI18n();
const bodyRef = ref(null);

/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
const props = defineProps({
  open: {type: Boolean, default: false},
  title: {type: String, required: true},
  subtitle: {type: String, default: ""},
  mobileMode: {
    type: String,
    default: "fullscreen",
    validator: (value) => ["fullscreen", "dialog"].includes(value),
  },
  panelClass: {type: [String, Array, Object], default: ""},
});

const emit = defineEmits(["close"]);
const responsiveLayoutStore = useResponsiveLayoutStore();
const isMobile = computed(() => Boolean(responsiveLayoutStore.isMobile));

const isMobileFullscreen = computed(
  () => isMobile.value && props.mobileMode === "fullscreen"
);
const isMobileDialog = computed(
  () => isMobile.value && props.mobileMode === "dialog"
);

const overlayMode = computed(() => {
  if (isMobileFullscreen.value) return "mobile-fullscreen";
  if (isMobileDialog.value) return "mobile-dialog";

  return "desktop-dialog";
});

const overlayClasses = computed(() => ({
  "responsive-overlay--desktop": !isMobile.value,
  "responsive-overlay--mobile": isMobileFullscreen.value,
  "responsive-overlay--mobile-dialog": isMobileDialog.value,
}));

const panelRenderKey = computed(() => overlayMode.value);

const showMobileBackButton = computed(() => isMobileFullscreen.value);
const showCloseButton = computed(() => !isMobileFullscreen.value);

useOverlayRegistration({
  open: toRef(props, "open"),
  kind: "responsive-overlay",
  mode: overlayMode,
});

watch(
  () => [props.open, isMobile.value, props.mobileMode],
  () => {
    if (typeof document === "undefined") return;
    if (props.open) {
      document.body.dataset.responsiveOverlayMode = overlayMode.value;
    } else if (document.body?.dataset?.responsiveOverlayMode) {
      delete document.body.dataset.responsiveOverlayMode;
    }
  },
  {immediate: true}
);
</script>
