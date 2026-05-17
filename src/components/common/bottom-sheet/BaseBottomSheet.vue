<template>
  <teleport to="body">
    <transition name="sheet-fade">
      <div v-if="open" class="bottom-sheet-backdrop" @click="emit('close')"></div>
    </transition>

    <transition name="sheet-slide">
      <section
        v-if="open"
        ref="sheetRef"
        class="bottom-sheet"
        :class="{
          'bottom-sheet--dragging': dragging,
          'bottom-sheet--fullscreen': currentSnap === 'full',
        }"
        role="dialog"
        aria-modal="true"
        :aria-label="resolvedTitle"
        :style="sheetStyle"
      >
        <div
          class="bottom-sheet-drag-area"
          role="button"
          tabindex="0"
          :aria-label="t('bottomSheet.resizeLabel')"
          @pointerdown="startDrag"
          @keydown.up.prevent="expand"
          @keydown.down.prevent="collapse"
          @keydown.esc.prevent="emit('close')"
        >
          <div class="bottom-sheet-handle" aria-hidden="true"></div>
        </div>

        <header class="bottom-sheet-header">
          <h2>{{ resolvedTitle }}</h2>
          <button
            type="button"
            class="bottom-sheet-close"
            :aria-label="t('common.close')"
            @click="emit('close')"
          >
            ×
          </button>
        </header>

        <div ref="bodyRef" class="bottom-sheet-body">
          <slot />
        </div>
      </section>
    </transition>
  </teleport>
</template>

<script setup>
import {computed} from 'vue';
import {useI18n} from 'vue-i18n';
import {useBottomSheetSizing} from '@/composables/useBottomSheetSizing';

const {t} = useI18n();

const props = defineProps({
  open: {type: Boolean, default: false},
  title: {type: String, default: ''},
  initialSnap: {type: String, default: 'content'},
  minHeight: {type: Number, default: 260},
  maxRatio: {type: Number, default: 0.92},
});

const emit = defineEmits(['close']);
const resolvedTitle = computed(() => props.title || t('bottomSheet.defaultTitle'));

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
