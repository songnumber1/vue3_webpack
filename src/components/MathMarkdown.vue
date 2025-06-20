<template>
  <vue3-markdown-it
    :source="processedSource"
    :plugins="markdownPlugins"
    :html="true"
    :breaks="true"
    :linkify="true"
    ref="markdown"
  />
</template>

<script>
import Vue3MarkdownIt from "vue3-markdown-it";
import mathFallbackPlugin, {
  getSuccessfulMathEngine,
} from "@/plugins/math-fallback-plugin";
import mermaid from "mermaid";

// Mermaid 플러그인 대신 직접 처리 (markdown-it-mermaid 불필요)
function mermaidCodeBlockWrapper(md) {
  const defaultFence =
    md.renderer.rules.fence ||
    function (tokens, idx, options, env, self) {
      return self.renderToken(tokens, idx, options);
    };

  md.renderer.rules.fence = function (tokens, idx, options, env, self) {
    const token = tokens[idx];
    if (token.info.trim() === "mermaid") {
      const code = token.content.trim();
      return `<div class="mermaid">${code}</div>`;
    }
    return defaultFence(tokens, idx, options, env, self);
  };
}

export default {
  name: "MathMarkdown",
  components: {Vue3MarkdownIt},
  props: {
    source: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      markdownPlugins: [
        {plugin: mathFallbackPlugin},
        {plugin: mermaidCodeBlockWrapper},
      ],
    };
  },
  computed: {
    processedSource() {
      return this.normalizeMathMarkdown(this.source);
    },
  },
  watch: {
    processedSource: {
      immediate: true,
      handler() {
        this.$nextTick(() => {
          const engine = getSuccessfulMathEngine();
          this.loadMathCss(engine);
          this.convertMermaid();
        });
      },
    },
  },
  methods: {
    normalizeMathMarkdown(markdown) {
      if (!markdown) return "";
      return markdown
        .replace(/\${3}([\s\S]*?)\${3}/g, (_, expr) => `$$${expr}$$`)
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\\\\/g, "\\"); // 4 → 2
    },
    loadMathCss(engine) {
      const links = {
        KaTeX: "https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css",
        TEMML: "https://cdn.jsdelivr.net/npm/temml@0.9.1/temml.min.css",
        MathJax: null,
      };
      const href = links[engine];
      if (!href) return;

      if (document.querySelector(`link[data-math-css="${engine}"]`)) return;

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-math-css", engine);
      document.head.appendChild(link);
    },
    convertMermaid() {
      const els = this.$el.querySelectorAll(".mermaid");
      if (els.length === 0) return;

      mermaid.initialize({startOnLoad: false});

      // eslint-disable-next-line no-unused-vars
      els.forEach((el, index) => {
        if (el.dataset.processed === "true") return;
        try {
          mermaid.init(undefined, el);
          el.dataset.processed = "true";
        } catch (e) {
          el.innerHTML = `<pre style="color:red;">Mermaid Error: ${e.message}</pre>`;
        }
      });
    },
  },
};
</script>

<style scoped>
/* 선택적 스타일 */
.katex {
  font-size: 1.1em;
}
</style>
