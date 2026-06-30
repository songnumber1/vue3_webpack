<template>
  <teleport to="body">
    <transition name="app-modal-fade">
      <div
        v-if="open"
        class="app-modal"
        :class="modalClass"
        :data-modal-size="size"
        @keydown.esc.prevent.stop="handleEscape"
      >
        <div
          class="app-modal__backdrop app-dialog-backdrop"
          aria-hidden="true"
          @click="handleBackdropClick"
        ></div>

        <section
          ref="panelRef"
          class="app-modal__panel app-dialog-panel"
          :class="panelClass"
          role="dialog"
          aria-modal="true"
          :aria-label="title ? null : resolvedAriaLabel"
          :aria-labelledby="title ? titleId : null"
          tabindex="-1"
        >
          <header v-if="showHeader" class="app-modal__header app-dialog-header">
            <div class="app-modal__heading">
              <strong v-if="title" :id="titleId" class="app-modal__title">
                {{ title }}
              </strong>
              <small v-if="subtitle" class="app-modal__subtitle">
                {{ subtitle }}
              </small>
              <slot v-if="!title && !subtitle" name="header" />
            </div>
            <button
              v-if="showClose"
              class="app-modal__close app-dialog-close"
              type="button"
              :aria-label="closeLabel || t('common.close')"
              @click="emit('close')"
            >
              ×
            </button>
          </header>

          <div ref="bodyRef" class="app-modal__body app-dialog-body">
            <slot />
          </div>

          <footer
            v-if="$slots.footer"
            class="app-modal__footer app-dialog-footer"
          >
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
/**
 * @file components/common/modal/AppModal.vue
 * @description PC/모바일 공통으로 사용하는 재사용 Modal입니다. 상태와 실제 액션은 상위에서 제어하고, 이 컴포넌트는 backdrop/scroll lock/slot 렌더링만 담당합니다.
 */

import {computed, nextTick, onBeforeUnmount, ref, toRef, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useScrollLock} from "@vueuse/core";
import {useOverlayRegistration} from "@/composables/overlay/useOverlayRegistration";
import {useOverlayStore} from "@/stores/overlayStore";

const {t} = useI18n();
const overlayStore = useOverlayStore();

const props = defineProps({
  open: {type: Boolean, default: false},
  title: {type: String, default: ""},
  subtitle: {type: String, default: ""},
  ariaLabel: {type: String, default: ""},
  closeLabel: {type: String, default: ""},
  closeOnBackdrop: {type: Boolean, default: true},
  closeOnEsc: {type: Boolean, default: true},
  showClose: {type: Boolean, default: true},
  showHeader: {type: Boolean, default: true},
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg", "fullscreen"].includes(value),
  },
  modalClass: {type: [String, Array, Object], default: ""},
  panelClass: {type: [String, Array, Object], default: ""},
});

const emit = defineEmits(["close", "backdrop", "escape"]);

const panelRef = ref(null);
const bodyRef = ref(null);
const bodyScrollLocked =
  typeof document === "undefined" ? ref(false) : useScrollLock(document.body);
const {overlayId} = useOverlayRegistration(toRef(props, "open"), "modal", () =>
  props.size === "fullscreen" ? "modal-fullscreen" : "modal-dialog"
);

const titleId = `app-modal-title-${overlayId}`;
const resolvedAriaLabel = computed(
  () => props.ariaLabel || props.subtitle || "Dialog"
);
const isTopOverlay = computed(
  () => overlayStore.topOverlay?.id === overlayId
);

function lockBodyScroll() {
  bodyScrollLocked.value = true;
}

function unlockBodyScroll() {
  bodyScrollLocked.value = false;
}

function focusPanel() {
  nextTick(() => {
    panelRef.value?.focus?.({preventScroll: true});
  });
}

function handleBackdropClick() {
  emit("backdrop");
  if (!props.closeOnBackdrop || !isTopOverlay.value) return;
  emit("close");
}

function handleEscape() {
  emit("escape");
  if (!props.closeOnEsc || !isTopOverlay.value) return;
  emit("close");
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      lockBodyScroll();
      focusPanel();
      return;
    }
    unlockBodyScroll();
  },
  {immediate: true}
);

onBeforeUnmount(unlockBodyScroll);
</script>
