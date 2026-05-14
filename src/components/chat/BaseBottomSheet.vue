<!--
@file BaseBottomSheet.vue * @description Vue component used in the chat
web application runtime. * @author OpenAI
-->

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
          'bottom-sheet--fullscreen': currentSnap === 'full'
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
          <button type="button" class="bottom-sheet-close" aria-label="닫기" @click="emit('close')">
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
import { computed, nextTick, onBeforeUnmount, watch, ref } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: "선택" },
  initialSnap: { type: String, default: "content" },
  minHeight: { type: Number, default: 260 },
  maxRatio: { type: Number, default: 0.92 }
});

const emit = defineEmits(["close"]);

const sheetRef = ref(null);
const bodyRef = ref(null);
const dragging = ref(false);
const currentHeight = ref(320);
const currentSnap = ref("content");

let dragStartY = 0;
let dragStartHeight = 0;
let previousBodyOverflow = "";
let viewportTimer = null;

const sheetStyle = computed(() => ({
  "--bottom-sheet-height": `${Math.round(currentHeight.value)}px`
}));

/**
 * getViewportHeight 처리 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getViewportHeight() {
  if (typeof window === "undefined") return 720;
  return Math.max(
    Math.round(window.visualViewport?.height || 0),
    Math.round(window.innerHeight || 0),
    320
  );
}

/**
 * getSafeBottom 처리 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getSafeBottom() {
  if (typeof window === "undefined") return 0;
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;bottom:env(safe-area-inset-bottom);height:0;visibility:hidden;";
  document.body.appendChild(probe);
  const value = Math.max(0, Math.round(window.innerHeight - probe.getBoundingClientRect().bottom));
  probe.remove();
  return Number.isFinite(value) ? value : 0;
}

/**
 * clampHeight 처리 함수입니다.
 * @param {*} height 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function clampHeight(height) {
  const viewportHeight = getViewportHeight();
  const maxHeight = Math.max(
    props.minHeight,
    Math.floor(viewportHeight * props.maxRatio) - getSafeBottom()
  );
  const minHeight = Math.min(props.minHeight, maxHeight);
  return Math.min(Math.max(height, minHeight), maxHeight);
}

/**
 * getContentHeight 처리 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getContentHeight() {
  const headerHeight = 62;
  const bodyHeight = bodyRef.value?.scrollHeight || 0;
  const padding = 30;
  return headerHeight + bodyHeight + padding;
}

/**
 * getInitialHeight 처리 함수입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
function getInitialHeight() {
  const viewportHeight = getViewportHeight();
  if (props.initialSnap === "full") return viewportHeight * props.maxRatio;
  if (props.initialSnap === "half") return viewportHeight * 0.58;
  return Math.max(props.minHeight, Math.min(getContentHeight(), viewportHeight * 0.72));
}

/**
 * setHeight 처리 함수입니다.
 * @param {*} height 함수 실행에 필요한 입력값입니다.
 * @param {*} snap 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function setHeight(height, snap = "custom") {
  currentHeight.value = clampHeight(height);
  const viewportHeight = getViewportHeight();
  currentSnap.value = currentHeight.value >= viewportHeight * 0.82 ? "full" : snap;
}

/**
 * expand 처리 함수입니다.
 * @returns {void}
 */
function expand() {
  setHeight(getViewportHeight() * props.maxRatio, "full");
}

/**
 * collapse 처리 함수입니다.
 * @returns {void}
 */
function collapse() {
  setHeight(props.minHeight, "min");
}

/**
 * resetHeight 처리 함수입니다.
 * @returns {void}
 */
function resetHeight() {
  nextTick(() => {
    setHeight(getInitialHeight(), props.initialSnap);
  });
}

/**
 * lockBodyScroll 처리 함수입니다.
 * @returns {void}
 */
function lockBodyScroll() {
  if (typeof document === "undefined") return;
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
}

/**
 * unlockBodyScroll 처리 함수입니다.
 * @returns {void}
 */
function unlockBodyScroll() {
  if (typeof document === "undefined") return;
  document.body.style.overflow = previousBodyOverflow;
}

/**
 * startDrag 처리 함수입니다.
 * @param {*} event 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function startDrag(event) {
  if (!event.isPrimary && event.pointerType !== "mouse") return;
  dragging.value = true;
  dragStartY = event.clientY;
  dragStartHeight = currentHeight.value;
  event.currentTarget?.setPointerCapture?.(event.pointerId);
  window.addEventListener("pointermove", handleDrag, { passive: false });
  window.addEventListener("pointerup", stopDrag, { passive: true });
  window.addEventListener("pointercancel", stopDrag, { passive: true });
}

/**
 * handleDrag 처리 함수입니다.
 * @param {*} event 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function handleDrag(event) {
  if (!dragging.value) return;
  event.preventDefault();
  const delta = dragStartY - event.clientY;
  setHeight(dragStartHeight + delta);
}

/**
 * stopDrag 처리 함수입니다.
 * @returns {void}
 */
function stopDrag() {
  if (!dragging.value) return;
  dragging.value = false;
  window.removeEventListener("pointermove", handleDrag);
  window.removeEventListener("pointerup", stopDrag);
  window.removeEventListener("pointercancel", stopDrag);

  const viewportHeight = getViewportHeight();
  if (currentHeight.value > viewportHeight * 0.76) expand();
  else if (currentHeight.value < props.minHeight * 0.82) emit("close");
}

/**
 * scheduleViewportRefresh 처리 함수입니다.
 * @returns {void}
 */
function scheduleViewportRefresh() {
  window.clearTimeout(viewportTimer);
  viewportTimer = window.setTimeout(() => {
    if (!props.open) return;
    setHeight(currentHeight.value, currentSnap.value);
  }, 60);
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      lockBodyScroll();
      resetHeight();
      window.addEventListener("resize", scheduleViewportRefresh, {
        passive: true
      });
      window.visualViewport?.addEventListener("resize", scheduleViewportRefresh, { passive: true });
      window.visualViewport?.addEventListener("scroll", scheduleViewportRefresh, { passive: true });
    } else {
      unlockBodyScroll();
      window.removeEventListener("resize", scheduleViewportRefresh);
      window.visualViewport?.removeEventListener("resize", scheduleViewportRefresh);
      window.visualViewport?.removeEventListener("scroll", scheduleViewportRefresh);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  unlockBodyScroll();
  window.clearTimeout(viewportTimer);
  window.removeEventListener("pointermove", handleDrag);
  window.removeEventListener("pointerup", stopDrag);
  window.removeEventListener("pointercancel", stopDrag);
  window.removeEventListener("resize", scheduleViewportRefresh);
  window.visualViewport?.removeEventListener("resize", scheduleViewportRefresh);
  window.visualViewport?.removeEventListener("scroll", scheduleViewportRefresh);
});
</script>
