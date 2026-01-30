<template>
  <div class="note-item" :class="typeClass" @mouseenter="pauseTimer" @mouseleave="resumeTimer">
    <div class="note-header">
      <div class="note-left">
        <!-- icon -->
        <span class="note-icon" v-html="iconSvg" />

        <strong class="note-title">
          {{ note.title }}
        </strong>
      </div>

      <!-- close -->
      <button class="note-close" v-html="closeSvg" @click="close" />
    </div>

    <div class="note-body">
      {{ note.content }}
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount } from "vue";
import {
  INFO_SVG,
  WARNING_SVG,
  SUCCESS_SVG,
  ERROR_SVG,
  CLOSE_SVG,
} from "@/storage/noteStore";

const props = defineProps({
  note: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["close"]);

/* =========================
   type → class
========================= */
const typeClass = computed(() => {
  return `note-${props.note.type || "info"}`;
});

/* =========================
   type → svg
========================= */
const iconSvg = computed(() => {
  switch (props.note.type) {
    case "success":
      return SUCCESS_SVG;
    case "warn":
    case "warning":
      return WARNING_SVG;
    case "error":
      return ERROR_SVG;
    default:
      return INFO_SVG;
  }
});

const closeSvg = CLOSE_SVG;

/* =========================
   Auto close with hover pause
========================= */

const duration = props.note.duration ?? 5000;

let timerId = null;
let startedAt = 0;
let remaining = duration;

/** start timer */
function startTimer() {
  if (!remaining || remaining <= 0) return;

  startedAt = Date.now();
  timerId = setTimeout(close, remaining);
}

/** pause on hover */
function pauseTimer() {
  if (!timerId) return;

  clearTimeout(timerId);
  timerId = null;

  const elapsed = Date.now() - startedAt;
  remaining = Math.max(0, remaining - elapsed);
}

/** resume on mouse leave */
function resumeTimer() {
  if (!remaining || remaining <= 0) return;
  startTimer();
}

/** close note */
function close() {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
  emit("close", props.note.id);
}

onMounted(() => {
  if (duration > 0) {
    startTimer();
  }
});

onBeforeUnmount(() => {
  if (timerId) {
    clearTimeout(timerId);
  }
});
</script>
