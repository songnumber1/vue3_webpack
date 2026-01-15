<template>
  <div class="markdown-container">
    <div
      :key="renderKey"
      v-html="html"
      ref="root"
      class="markdown-content"
    ></div>
  </div>
</template>

<script>
import {
  createStreamProcessor,
  createCompletedProcessor,
  convertMarkdownSafe,
  initMermaid,
  renderRuntimeMermaid,
} from "@/utils/rehypeMermaid";

export default {
  name: "Markdown",
  props: {
    content: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    showLineNumbers: { type: Boolean, default: true },
  },
  data() {
    return {
      html: "",
      mermaidFallbackStore: [],
      renderKey: 0, // 🔥 DOM 강제 재생성
      _mermaidInited: false,
    };
  },
  watch: {
    content: {
      immediate: true,
      handler() {
        this.convertMarkdown();
      },
    },
    isCompleted() {
      this._mermaidInited = false;
      this.convertMarkdown();
    },
    showLineNumbers() {
      this.convertMarkdown();
    },
  },
  mounted() {
    this.$el.addEventListener("click", this.onCopyClick);
  },
  beforeUnmount() {
    this.$el.removeEventListener("click", this.onCopyClick);
  },
  methods: {
    async convertMarkdown() {
      const processor = this.isCompleted
        ? createCompletedProcessor({ showLineNumbers: this.showLineNumbers })
        : createStreamProcessor({ showLineNumbers: this.showLineNumbers });

      const { html, file } = await convertMarkdownSafe({
        markdown: this.content || "",
        isCompleted: this.isCompleted,
        streamProcessor: processor,
        completedProcessor: processor,
      });

      this.html = html;
      this.renderKey++; // ✅ 핵심
      this.mermaidFallbackStore = file?.data?.mermaidFallbackStore ?? [];

      if (this.isCompleted) {
        await this.$nextTick();

        if (!this._mermaidInited) {
          initMermaid();
          this._mermaidInited = true;
        }

        await renderRuntimeMermaid(this.$refs.root, this.mermaidFallbackStore);
      }
    },

    async onCopyClick(e) {
      const btn = e.target.closest?.("button[data-copy='1']");
      if (!btn) return;

      const block = btn.closest(".codeblock");
      if (!block) return;

      const lines = Array.from(block.querySelectorAll(".line-code")).map(
        (n) => n.textContent || ""
      );

      try {
        await navigator.clipboard.writeText(lines.join("\n"));
        btn.textContent = "Copied!";
        setTimeout(() => (btn.textContent = "Copy"), 800);
      } catch {
        btn.textContent = "Copy failed";
        setTimeout(() => (btn.textContent = "Copy"), 800);
      }
    },
  },
};
</script>
