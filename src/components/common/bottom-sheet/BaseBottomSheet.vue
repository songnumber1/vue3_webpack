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
        :aria-label="title"
        :style="sheetStyle"
      >
        <div
          class="bottom-sheet-drag-area"
          role="button"
          tabindex="0"
          aria-label="바텀시트 크기 조절"
          @pointerdown="startDrag"
          @keydown.up.prevent="expand"
          @keydown.down.prevent="collapse"
          @keydown.esc.prevent="emit('close')"
        >
          <div class="bottom-sheet-handle" aria-hidden="true"></div>
        </div>

        <header class="bottom-sheet-header">
          <h2>{{ title }}</h2>
          <button
            type="button"
            class="bottom-sheet-close"
            aria-label="닫기"
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
import {useBottomSheetSizing} from '@/composables/useBottomSheetSizing';

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const props = defineProps({
  open: {type: Boolean, default: false},
  title: {type: String, default: '선택'},
  initialSnap: {type: String, default: 'content'},
  minHeight: {type: Number, default: 260},
  maxRatio: {type: Number, default: 0.92},
});

const emit = defineEmits(['close']);

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
