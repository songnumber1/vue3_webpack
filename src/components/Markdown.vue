<template>
  <div class="markdown-container">
    <div :key="renderKey" ref="root" class="markdown-content" v-html="html" />
  </div>
</template>

<script>
import {
  convertMarkdownSafe,
  initMermaid,
  renderMermaidFromStore,
} from "@/utils/rehypeMermaid";

export default {
  name: "Markdown",
  props: {
    content: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
  },
  data() {
    return {
      html: "",
      renderKey: 0,
      mermaidFallbackStore: [],
    };
  },
  watch: {
    content: "render",
    isCompleted: "render",
  },
  async mounted() {
    initMermaid();
    await this.render();
  },
  methods: {
    async render() {
      const { html, file } = await convertMarkdownSafe({
        markdown: this.content,
        isCompleted: this.isCompleted,
      });

      this.html = html;
      this.renderKey++;

      this.mermaidFallbackStore = file.data?.mermaidFallbackStore || [];

      if (this.isCompleted && this.mermaidFallbackStore.length) {
        await this.$nextTick();
        await renderMermaidFromStore(
          this.$refs.root,
          this.mermaidFallbackStore
        );
      }
    },
  },
};
</script>
