<template>
  <teleport to="body">
    <transition name="sheet-fade">
      <div
        v-if="open"
        :class="['bottom-sheet-backdrop', 'app-dialog-backdrop', overlayClass]"
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
import {useI18n} from "vue-i18n";
import {useBottomSheetSizing} from "@/composables/bottom-sheet/useBottomSheetSizing";

const {t} = useI18n();

const props = defineProps({
  open: {type: Boolean, default: false},
  title: {type: String, default: ""},
  initialSnap: {type: String, default: "content"},
  minHeight: {type: Number, default: 260},
  maxRatio: {type: Number, default: 0.92},
  overlayClass: {type: String, default: ""},
});

const emit = defineEmits(["close"]);

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
