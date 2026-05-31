<template>
  <teleport to="body">
    <transition name="sheet-fade">
      <div
        v-if="open"
        :class="['bottom-sheet-backdrop', 'app-dialog-backdrop', 'tw-fixed', 'tw-inset-0', 'tw-z-bottomSheetBackdrop', 'tw-bg-app-drawerOverlay', overlayClass]"
        @click="emit('close')"
      ></div>
    </transition>

    <transition name="sheet-slide">
      <section
        v-if="open"
        ref="sheetRef"
        :class="[
          'bottom-sheet',
          'app-bottom-sheet-panel',
          'tw-fixed',
          'tw-inset-x-0',
          'tw-bottom-0',
          'tw-z-bottomSheet',
          'tw-flex',
          'tw-min-h-0',
          'tw-flex-col',
          'tw-overflow-hidden',
          'tw-rounded-t-dialog',
          'tw-border',
          'tw-border-app-border',
          'tw-bg-app-menu',
          'tw-text-app-text',
          'tw-shadow-menu',
          overlayClass,
          {
            'bottom-sheet--dragging': dragging,
            'bottom-sheet--fullscreen': currentSnap === 'full',
          },
        ]"
        role="dialog"
        aria-modal="true"
        :aria-label="title || t('common.select')"
        :style="sheetStyle"
      >
        <div
          class="bottom-sheet-drag-area"
          role="button"
          tabindex="0"
          :aria-label="t('common.resize')"
          @pointerdown="startDrag"
          @keydown.up.prevent="expand"
          @keydown.down.prevent="collapse"
          @keydown.esc.prevent="emit('close')"
        >
          <div class="bottom-sheet-handle" aria-hidden="true"></div>
        </div>

        <header class="bottom-sheet-header app-dialog-header">
          <button
            v-if="showBack"
            type="button"
            class="bottom-sheet-back app-dialog-back"
            :aria-label="backLabel || t('common.back')"
            @click="emit('back')"
          >
            ‹
          </button>
          <h2>{{ title || t("common.select") }}</h2>
          <button
            type="button"
            class="bottom-sheet-close app-dialog-close"
            :aria-label="t('common.close')"
            @click="emit('close')"
          >
            ×
          </button>
        </header>

        <div ref="bodyRef" class="bottom-sheet-body app-dialog-body">
          <slot />
        </div>
      </section>
    </transition>
  </teleport>
</template>

<script setup>
/**
 * @file components/common/bottom-sheet/BaseBottomSheet.vue
 * @description 재사용 UI 컴포넌트입니다. 화면 상태는 상위 props/action에서 받고 내부에서는 렌더와 사용자 이벤트만 처리합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {toRef} from "vue";
import {useI18n} from "vue-i18n";
import {useBottomSheetSizing} from "@/composables/bottom-sheet/useBottomSheetSizing";
import {useOverlayRegistration} from "@/composables/overlay/useOverlayRegistration";

const {t} = useI18n();

/**
 * 상위 컴포넌트에서 전달되는 렌더링/상태 제어 입력값입니다.
 */
const props = defineProps({
  open: {type: Boolean, default: false},
  title: {type: String, default: ""},
  initialSnap: {type: String, default: "content"},
  minHeight: {type: Number, default: 260},
  maxRatio: {type: Number, default: 0.92},
  overlayClass: {type: String, default: ""},
  showBack: {type: Boolean, default: false},
  backLabel: {type: String, default: ""},
});

const emit = defineEmits(["close", "back"]);

useOverlayRegistration({
  open: toRef(props, "open"),
  kind: "bottom-sheet",
  mode: "mobile-sheet",
});

const {
  sheetRef,
  bodyRef,
  dragging,
  currentSnap,
  sheetStyle,
  startDrag,
  expand,
  collapse,
} = useBottomSheetSizing(props, emit);

</script>
