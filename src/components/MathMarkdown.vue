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

import markdownItKatex from "markdown-it-katex";
import markdownItTemml from "markdown-it-math/temml";
import markdownItMathjax from "markdown-it-mathjax3";

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
    useTemml: Boolean,
    useKatex: Boolean,
    useMathjax: Boolean,
    useFallback: Boolean,
    source: {
      type: String,
      required: true,
    },
  },
  // data() {
  //   return {
  //     markdownPlugins: [
  //       {plugin: mathFallbackPlugin},
  //       {plugin: mermaidCodeBlockWrapper},
  //     ],
  //   };
  // },
  computed: {
    processedSource() {
      return this.normalizeMathMarkdown(this.source);
    },
    markdownPlugins() {
      const plugins = [];

      // 조건부 수학 플러그인
      if (this.useFallback) {
        plugins.push({plugin: mathFallbackPlugin});
      } else {
        // 맨 마지막 플러그인이 적용되므로 순서가 중요하다
        if (this.useMathjax) plugins.push({plugin: markdownItMathjax});
        if (this.useKatex) plugins.push({plugin: markdownItKatex});
        if (this.useTemml) plugins.push({plugin: markdownItTemml});
      }

      // ✅ Mermaid 플러그인은 항상 마지막에 포함
      plugins.push({plugin: mermaidCodeBlockWrapper});

      return plugins;
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
    markdownPlugins: {
      immediate: true,
      handler() {
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              this.convertMermaid();
            }, 20);
          });
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

<style>
/* Mermaid 스타일 전역 적용 */
/* .mermaid {
  display: block;
  overflow: auto;
  margin: 1em 0;
}

.mermaid svg {
  width: 100% !important;
  height: auto !important;
} */
</style>
