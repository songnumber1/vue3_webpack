<template>
  <div ref="root" class="note note--success" :class="`note--${type}`">
    <div class="note-header">
      <span class="note-icon" v-html="iconSvg" />
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
      <div>{{ content }}</div>
      <a :href="href" target="_blank">{{ linkText }}</a>
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
} from "@/storage/noteStore";

export default {
  name: "LinkNote",
  props: {
    title: String,
    content: String,
    href: String,
    linkText: { type: String, default: "바로가기" },
    duration: { type: Number, default: 5000 },
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
