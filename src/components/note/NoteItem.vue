<template>
  <div class="note-item" :class="typeClass" @mouseenter="pauseTimer" @mouseleave="resumeTimer">
    <!-- header -->
    <div class="note-header">
      <div class="note-left">
        <span class="note-icon" v-html="iconSvg"></span>
        <strong class="note-title">{{ note.title }}</strong>
      </div>

      <button class="note-close" v-html="closeSvg" @click="close" />
    </div>

    <!-- body -->
    <div class="note-body">
      <!-- Custom note -->
      <component v-if="note.component" :is="note.component" v-bind="note.props" @height="emitHeight" />

      <!-- Default note -->
      <template v-else>
        {{ note.content }}
      </template>
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
  note: { type: Object, required: true },
  index: { type: Number, default: 0 },
});

const emit = defineEmits(["close", "height"]);

/* =========================
   type → class
========================= */
const typeClass = computed(() => `note-${props.note.type || "info"}`);

/* =========================
   type → icon
========================= */
const iconSvg = computed(() => {
  switch (props.note.type) {
    case "success":
      return SUCCESS_SVG;
    case "warning":
    case "warn":
      return WARNING_SVG;
    case "error":
      return ERROR_SVG;
    default:
      return INFO_SVG;
  }
});

const closeSvg = CLOSE_SVG;

/* =========================
   auto close + hover pause
========================= */
let timerId = null;
let startedAt = 0;
let remaining = 0;

function clearTimer() {
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}

function startTimer() {
  if (!remaining || remaining <= 0) return;
  startedAt = Date.now();
  clearTimer();
  timerId = setTimeout(close, remaining);
}

function pauseTimer() {
  if (!timerId) return;
  const elapsed = Date.now() - startedAt;
  remaining = Math.max(0, remaining - elapsed);
  clearTimer();
}

function resumeTimer() {
  if (!remaining || remaining <= 0) return;
  startTimer();
}

function close() {
  clearTimer();
  emit("close", props.note.id);
}

function emitHeight(h) {
  emit("height", props.index, h);
}

onMounted(() => {
  remaining = props.note.duration ?? 5000;
  if (remaining > 0) startTimer();
});

onBeforeUnmount(() => {
  clearTimer();
});
</script>
