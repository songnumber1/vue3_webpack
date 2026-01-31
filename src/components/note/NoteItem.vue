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

<script>
import {
  INFO_SVG,
  WARNING_SVG,
  SUCCESS_SVG,
  ERROR_SVG,
  CLOSE_SVG,
} from "@/storage/noteStore";

export default {
  name: "NoteItem",

  props: {
    note: { type: Object, required: true },
    index: { type: Number, default: 0 },
  },

  emits: ["close", "height"],

  data() {
    return {
      timerId: null,
      startedAt: 0,
      remaining: 0,
      closeSvg: CLOSE_SVG,
    };
  },

  computed: {
    typeClass() {
      return `note-${this.note.type || "info"}`;
    },

    iconSvg() {
      switch (this.note.type) {
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
    },
  },

  mounted() {
    this.remaining = this.note.duration ?? 5000;
    if (this.remaining > 0) this.startTimer();
  },

  beforeUnmount() {
    this.clearTimer();
  },

  methods: {
    clearTimer() {
      if (this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = null;
      }
    },

    startTimer() {
      if (!this.remaining || this.remaining <= 0) return;

      this.startedAt = Date.now();
      this.clearTimer();

      this.timerId = setTimeout(() => {
        this.close();
      }, this.remaining);
    },

    pauseTimer() {
      if (!this.timerId) return;

      const elapsed = Date.now() - this.startedAt;
      this.remaining = Math.max(0, this.remaining - elapsed);
      this.clearTimer();
    },

    resumeTimer() {
      if (!this.remaining || this.remaining <= 0) return;
      this.startTimer();
    },

    close() {
      this.clearTimer();
      this.$emit("close", this.note.id);
    },

    emitHeight(h) {
      this.$emit("height", this.index, h);
    },
  },
};
</script>
