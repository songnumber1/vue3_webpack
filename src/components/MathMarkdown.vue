<!-- <script>
import Vue3MarkdownIt from "vue3-markdown-it";
// eslint-disable-next-line no-unused-vars
import markdownItTemml from "markdown-it-math/temml";
// eslint-disable-next-line no-unused-vars
import markdownItKatex from "markdown-it-katex";
// eslint-disable-next-line no-unused-vars
import markdownItMathJax from "markdown-it-mathjax3";
// eslint-disable-next-line no-unused-vars
import mathFallbackPlugin from "@/plugins/math-fallback-plugin";

export default {
  components: {Vue3MarkdownIt},
  props: {
    source: String,
  },
  computed: {
    markdownPlugins() {
      return [
        // {plugin: markdownItTemml},
        // {plugin: markdownItKatex},
        // { plugin: markdownItMathJax },
        {plugin: mathFallbackPlugin},
      ];
    },
  },
};
</script>

<template>
  <Vue3MarkdownIt
    :source="source"
    :plugins="markdownPlugins"
    :html="true"
    :breaks="true"
    :linkify="true"
  />
</template> -->

<template>
  <div ref="content">
    <vue3-markdown-it
      :source="processedSource"
      :plugins="markdownPlugins"
      :html="true"
      :breaks="true"
      :linkify="true"
      ref="markdown"
    />
  </div>
</template>

<script>
import Vue3MarkdownIt from "vue3-markdown-it";
// eslint-disable-next-line no-unused-vars
import mathFallbackPlugin, {
  getSuccessfulMathEngine,
} from "@/plugins/math-fallback-plugin";
import mermaid from "mermaid";
import mermaidItMermaid from "markdown-it-mermaid";

mermaid.initialize({startOnLoad: false});

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
        {plugin: mermaidItMermaid},
      ],
    };
  },
  computed: {
    processedSource() {
      return this.normalizeMathMarkdown(this.source);
    },
    // markdownPlugins() {
    //   return [{plugin: mathFallbackPlugin}];
    // },
  },
  watch: {
    processedSource: {
      immediate: true,
      handler() {
        this.$nextTick(() => {
          // getSuccessfulMathEngine();

          setTimeout(() => {
            const engine = getSuccessfulMathEngine();
            this.loadMathCss(engine);
            this.$nextTick(this.convertMermaid);
          }, 50);
        });
      },
    },
  },
  methods: {
    convertMermaid() {
      try {
        mermaid.init(
          undefined,
          this.$refs.content.querySelectorAll(".mermaid")
        );
      } catch (err) {
        console.warn("Mermaid rendering failed:", err);
      }
      // const el = this.$refs.markdown?.$el;

      // console.log(el);
      // if (!el) return;

      // // mermaid 코드 블록을 찾아서 SVG로 대체
      // el.querySelectorAll("mermaid").forEach((block) => {
      //   const code = block.textContent.trim();
      //   const container = document.createElement("div");
      //   container.className = "mermaid";
      //   const id = "mermaid-" + Date.now();
      //   try {
      //     const svg = mermaid.render(id, code, () => {});
      //     container.innerHTML = svg;
      //     console.log(svg);
      //     block.replaceWith(container);
      //   } catch (e) {
      //     container.innerHTML = `<pre style="color:red;">Mermaid Syntax Error</pre>`;
      //     block.replaceWith(container);
      //   }
      // });
    },
    normalizeMathMarkdown(markdown) {
      if (!markdown) return "";
      return (
        markdown
          .replace(/\${3}([\s\S]*?)\${3}/g, (_, expr) => `$$${expr}$$`)
          .replace(/\r\n/g, "\n")
          .replace(/\n{3,}/g, "\n\n")
          // 3. \\\\ → \\ (이스케이프 줄이기)
          .replace(/\\\\/g, "\\")
      ); // from 4 backslashes → 2
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
  },
};
</script>
