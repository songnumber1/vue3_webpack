<template>
  <div ref="root" class="note" :class="`note--${type}`">
    <div class="note-header">
      <!-- ❗ self-closing 제거 -->
      <span class="note-icon" v-html="iconSvg"></span>

      <strong class="note-title">{{ title }}</strong>

      <button
        class="note-close"
        type="button"
        aria-label="닫기"
        @click="$emit('close')"
        v-html="closeSvg"
      ></button>
    </div>

    <div class="note-content">
      <progress :value="percent" max="100" />
      <div>{{ percent }}%</div>
    </div>
  </div>
</template>

<script>
import {
  WARNING_SVG,
  SUCCESS_SVG,
  ERROR_SVG,
  INFO_SVG,
  CLOSE_SVG,
} from "@/storage/noteStore"; // 경로는 네 프로젝트 기준 유지

export default {
  name: "ProgressNote",

  props: {
    title: { type: String, default: "" },
    percent: { type: Number, required: true },
    duration: { type: Number, default: 5000 },

    // 🔥 반드시 필요
    type: {
      type: String,
      default: "info", // info | warning | success | error
    },
  },

  computed: {
    iconSvg() {
      switch (this.type) {
        case "warning":
          return WARNING_SVG;
        case "success":
          return SUCCESS_SVG;
        case "error":
          return ERROR_SVG;
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

    setTimeout(() => this.$emit("close"), this.duration);
  },
};
</script>
