<template>
  <teleport to="body">
    <transition name="mobile-page">
      <div
        v-if="open"
        class="responsive-overlay responsive-overlay--mobile"
        :class="overlayClasses"
        :data-overlay-mode="overlayMode"
      >
        <section
          :key="overlayMode"
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
 * @description 모바일 전용 overlay입니다. fullscreen/page 또는 dialog 형태만 렌더링합니다.
 */

import {computed, ref, toRef, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useOverlayRegistration} from "@/composables/overlay/useOverlayRegistration";

const {t} = useI18n();
const bodyRef = ref(null);

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

const isDialog = computed(() => props.mobileMode === "dialog");
const overlayMode = computed(() =>
  isDialog.value ? "mobile-dialog" : "mobile-fullscreen"
);
const overlayClasses = computed(() => ({
  "responsive-overlay--mobile-dialog": isDialog.value,
}));
const showMobileBackButton = computed(() => !isDialog.value);
const showCloseButton = computed(() => isDialog.value);

useOverlayRegistration(toRef(props, "open"), "responsive-overlay", overlayMode);

watch(
  () => [props.open, overlayMode.value],
  () => {
    if (typeof document === "undefined") return;
    if (props.open) {
      document.body.dataset.responsiveOverlayMode = overlayMode.value;
      return;
    }
    delete document.body.dataset.responsiveOverlayMode;
  },
  {immediate: true}
);
</script>
