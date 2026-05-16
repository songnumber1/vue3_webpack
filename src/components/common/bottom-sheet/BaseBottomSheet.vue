<!--
@file BaseBottomSheet.vue
@description Shared mobile bottom sheet component used by assistant, language, playground, and prompt menus.
@author OpenAI
-->

<template>
  <teleport to="body">
    <transition name="sheet-fade">
      <div
        v-if="open"
        class="bottom-sheet-backdrop"
        @click="emit('close')"
      ></div>
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
import {computed, nextTick, onBeforeUnmount, watch, ref} from "vue";
import {
  getMobileBrowserFamily,
  getSafeAreaBottom,
  getViewportHeight as readViewportHeight,
  isMobileViewport as readIsMobileViewport,
} from "@/utils/viewport";

const props = defineProps({
  open: {type: Boolean, default: false},
  title: {type: String, default: "선택"},
  initialSnap: {type: String, default: "content"},
  minHeight: {type: Number, default: 260},
  maxRatio: {type: Number, default: 0.92},
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

const MOBILE_BREAKPOINT_PX = 900;
const MIN_VISIBLE_OPTION_COUNT = 3;
const DEFAULT_OPTION_HEIGHT_PX = 58;
const DEFAULT_SHEET_CHROME_HEIGHT_PX = 122;

const sheetStyle = computed(() => ({
  "--bottom-sheet-height": `${Math.round(currentHeight.value)}px`,
}));

function getViewportHeight() {
  return readViewportHeight();
}

function isMobileViewport() {
  return readIsMobileViewport(MOBILE_BREAKPOINT_PX);
}

/**
 * Returns the non-scrollable chrome height of the bottom sheet.
 * This includes drag handle, title header and bottom padding.
 *
 * @returns {number} Estimated fixed chrome height in pixels.
 */
function getSheetChromeHeight() {
  const sheet = sheetRef.value;
  if (!sheet) return DEFAULT_SHEET_CHROME_HEIGHT_PX;

  const dragArea = sheet.querySelector(".bottom-sheet-drag-area");
  const header = sheet.querySelector(".bottom-sheet-header");
  const sheetStyle = window.getComputedStyle(sheet);
  const paddingBottom = Number.parseFloat(sheetStyle.paddingBottom || "0") || 0;

  return Math.ceil(
    (dragArea?.getBoundingClientRect().height || 28) +
      (header?.getBoundingClientRect().height || 50) +
      paddingBottom +
      18
  );
}

/**
 * Calculates the minimum body height required to show the first three rows.
 * The value is data-driven when option elements exist and falls back to a
 * conservative row size for Firefox Android's first render pass.
 *
 * @returns {number} Minimum visible body height in pixels.
 */
function getMinimumVisibleBodyHeight() {
  const body = bodyRef.value;
  const options = Array.from(
    body?.querySelectorAll?.(".bottom-sheet-option") || []
  );

  if (!options.length)
    return DEFAULT_OPTION_HEIGHT_PX * MIN_VISIBLE_OPTION_COUNT;

  const visibleOptions = options.slice(0, MIN_VISIBLE_OPTION_COUNT);
  const totalOptionHeight = visibleOptions.reduce((sum, option) => {
    const rectHeight = option.getBoundingClientRect().height;
    return sum + (rectHeight > 0 ? rectHeight : DEFAULT_OPTION_HEIGHT_PX);
  }, 0);

  return Math.ceil(totalOptionHeight + 12);
}

/**
 * Measures only the real slot content height instead of the flex-expanded sheet
 * body. Firefox Android can report the flex body height as the available sheet
 * area, which makes content-sized sheets much taller than their item list.
 *
 * @returns {number} Actual rendered slot content height in pixels.
 */
function getBodyContentHeight() {
  const body = bodyRef.value;
  if (!body) return 0;

  const children = Array.from(body.children || []);
  if (!children.length) return body.scrollHeight || 0;

  const contentHeight = children.reduce((sum, child) => {
    const rectHeight = child.getBoundingClientRect().height;
    return sum + (rectHeight > 0 ? rectHeight : child.scrollHeight || 0);
  }, 0);

  const bodyStyle = window.getComputedStyle(body);
  const paddingTop = Number.parseFloat(bodyStyle.paddingTop || "0") || 0;
  const paddingBottom = Number.parseFloat(bodyStyle.paddingBottom || "0") || 0;

  return Math.ceil(contentHeight + paddingTop + paddingBottom);
}

/**
 * Returns the minimum sheet height required for mobile usability.
 *
 * @returns {number} Minimum sheet height in pixels.
 */
function getMinimumSheetHeight() {
  if (!isMobileViewport()) return props.minHeight;
  return Math.max(
    props.minHeight,
    getSheetChromeHeight() + getMinimumVisibleBodyHeight()
  );
}

/**
 * clampHeight 처리 함수입니다.
 * @param {*} height 함수 실행에 필요한 입력값입니다.
 * @returns {void}
 */
function clampHeight(height) {
  const viewportHeight = getViewportHeight();
  const preferredMinHeight = getMinimumSheetHeight();
  const maxHeight = Math.max(
    preferredMinHeight,
    Math.floor(viewportHeight * props.maxRatio) - getSafeAreaBottom()
  );
  const minHeight = Math.min(preferredMinHeight, maxHeight);
  return Math.min(Math.max(height, minHeight), maxHeight);
}

/**
 * Returns the full sheet height needed by the rendered slot content.
 * @returns {number} Content-based sheet height in pixels.
 */
function getContentHeight() {
  return getSheetChromeHeight() + getBodyContentHeight() + 8;
}

/**
 * Calculates the opening snap height from props and measured content.
 * @returns {number} Initial sheet height in pixels.
 */
function getInitialHeight() {
  const viewportHeight = getViewportHeight();
  if (props.initialSnap === "full") return viewportHeight * props.maxRatio;
  if (props.initialSnap === "half") return viewportHeight * 0.58;

  const minimumSheetHeight = getMinimumSheetHeight();
  const contentHeight = getContentHeight();
  const contentSnapRatio =
    isMobileViewport() && getMobileBrowserFamily() === "firefox" ? 0.64 : 0.72;

  return Math.max(
    minimumSheetHeight,
    Math.min(contentHeight, viewportHeight * contentSnapRatio)
  );
}

/**
 * Applies a clamped sheet height and records the active snap state.
 * @param {number} height Requested height in pixels.
 * @param {string} snap Snap state label.
 * @returns {void}
 */
function setHeight(height, snap = "custom") {
  currentHeight.value = clampHeight(height);
  const viewportHeight = getViewportHeight();
  currentSnap.value =
    currentHeight.value >= viewportHeight * 0.82 ? "full" : snap;
}

/** Expands the sheet to the maximum configured height. */
function expand() {
  setHeight(getViewportHeight() * props.maxRatio, "full");
}

/** Collapses the sheet to its minimum usable height. */
function collapse() {
  setHeight(props.minHeight, "min");
}

/** Re-measures content after render and refreshes the opening height. */
function resetHeight() {
  nextTick(() => {
    setHeight(getInitialHeight(), props.initialSnap);

    window.requestAnimationFrame?.(() => {
      setHeight(getInitialHeight(), props.initialSnap);
      window.requestAnimationFrame?.(() => {
        setHeight(getInitialHeight(), props.initialSnap);
      });
    });
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
  window.addEventListener("pointermove", handleDrag, {passive: false});
  window.addEventListener("pointerup", stopDrag, {passive: true});
  window.addEventListener("pointercancel", stopDrag, {passive: true});
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
        passive: true,
      });
      window.visualViewport?.addEventListener(
        "resize",
        scheduleViewportRefresh,
        {passive: true}
      );
      window.visualViewport?.addEventListener(
        "scroll",
        scheduleViewportRefresh,
        {passive: true}
      );
    } else {
      unlockBodyScroll();
      window.removeEventListener("resize", scheduleViewportRefresh);
      window.visualViewport?.removeEventListener(
        "resize",
        scheduleViewportRefresh
      );
      window.visualViewport?.removeEventListener(
        "scroll",
        scheduleViewportRefresh
      );
    }
  },
  {immediate: true}
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
