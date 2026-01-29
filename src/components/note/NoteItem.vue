<template>
  <div
    ref="root"
    class="note"
    :class="`note--${note.type}`"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <div class="note-header">
      <span class="note-icon" v-html="iconSvg" />
      <strong class="note-title">{{ note.title }}</strong>
      <button
        class="note-close"
        type="button"
        aria-label="닫기"
        @click="$emit('close')"
        v-html="closeSvg"
      ></button>
    </div>

    <div class="note-content">
      <NoteDefaultContent :content="note.content" />
    </div>
  </div>
</template>

<script>
import NoteDefaultContent from "./NoteDefaultContent.vue";

import {
  WARNING_SVG,
  SUCCESS_SVG,
  ERROR_SVG,
  INFO_SVG,
  CLOSE_SVG,
} from "@/storage/noteStore";

export default {
  name: "NoteItem",
  components: { NoteDefaultContent },

  props: {
    note: { type: Object, required: true },
  },

  data() {
    return {
      timer: null,
      startAt: 0,
      remaining: 0,
    };
  },

  computed: {
    iconSvg() {
      switch (this.note.type) {
        case "success":
          return SUCCESS_SVG;
        case "error":
          return ERROR_SVG;
        case "warning":
          return WARNING_SVG;
        default:
          return INFO_SVG;
      }
    },

    closeSvg() {
      return CLOSE_SVG;
    },
  },

  mounted() {
    this.$nextTick(() => {
      this.$emit("height", this.$refs.root.offsetHeight);
    });

    this.remaining = this.note.duration;
    this.startTimer();
  },

  beforeUnmount() {
    clearTimeout(this.timer);
  },

  methods: {
    startTimer() {
      this.startAt = Date.now();
      clearTimeout(this.timer);
      this.timer = setTimeout(this.close, this.remaining);
    },
    pauseTimer() {
      clearTimeout(this.timer);
      const elapsed = Date.now() - this.startAt;
      this.remaining = Math.max(this.remaining - elapsed, 0);
    },
    onEnter() {
      this.pauseTimer();
    },
    onLeave() {
      if (this.remaining > 0) this.startTimer();
    },
    close() {
      this.$emit("close");
    },
  },
};
</script>
