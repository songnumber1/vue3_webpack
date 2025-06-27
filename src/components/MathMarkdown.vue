<template>
  <vue3-markdown-it
    :source="processedSource"
    :plugins="markdownPlugins"
    :html="true"
    :breaks="true"
    :linkify="true"
  />
</template>

<script>
import Vue3MarkdownIt from "vue3-markdown-it";
import markdownItTemml from "markdown-it-math/temml";
import temml from "temml";
import katex from "katex";
import "katex/dist/katex.min.css";
import {renderMathInElement} from "mathup";
import mermaid from "mermaid";
// eslint-disable-next-line no-unused-vars
import markdownItMermaid from "markdown-it-mermaid";

// Mermaid 코드 블럭 wrapper
// eslint-disable-next-line no-unused-vars
function mermaidCodeBlockWrapper(md) {
  const defaultFence =
    md.renderer.rules.fence ||
    ((tokens, idx, options, env, self) =>
      self.renderToken(tokens, idx, options));
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
    source: {type: String, required: true},
  },
  computed: {
    processedSource() {
      return this.normalizeMathMarkdown(this.source);
    },
    markdownPlugins() {
      return [
        {
          plugin: markdownItTemml,
          options: {
            inlineDelimiters: [["$", "$"]],
            blockDelimiters: [
              ["$$", "$$"],
              ["\\[", "\\]"],
            ],
            inlineRenderer: (str) => this.renderMathWithFallback(str, false),
            blockRenderer: (str) => this.renderMathWithFallback(str, true),
          },
        },
        {plugin: mermaidCodeBlockWrapper},
        // markdownItMermaid 모두 정상적으로 렌더링하지 못함ㅁ
        // 위의 mermaidCodeBlockWrapper하고 같이 mermaid를 렌더링하므로 //
        // mermaidCodeBlockWrapper보다 늦게 선언된 markdownItMermaid 기준으로 렌더링하므로 아래 주석 코드를 해제하면
        // 정상적으로 렌더링이 안된다
        // {plugin: markdownItMermaid},
      ];
    },
  },
  watch: {
    processedSource: {
      immediate: true,
      handler() {
        this.$nextTick(() => {
          requestAnimationFrame(() => {
            setTimeout(() => {
              this.convertMermaid();
            }, 10);
          });
        });
      },
    },
  },
  methods: {
    normalizeMathMarkdown(md) {
      if (!md) return "";
      return md
        .replace(/\${3}([\s\S]*?)\${3}/g, (_, expr) => `$$${expr}$$`)
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[\uE000-\uF8FF]/g, "");
    },
    renderMathWithFallback(str, displayMode) {
      const wrap = (html, engine) =>
        `<div class="math-render" data-engine="${engine}" style="${
          displayMode ? "" : "display:inline"
        }">${html}</div>`;
      try {
        const html = temml.renderToString(str, {display: displayMode});
        if (!html || html.includes("temml-error"))
          throw new Error("Temml failed");
        return wrap(html, "Temml");
      } catch {
        try {
          const html = katex.renderToString(str, {
            displayMode,
            throwOnError: false,
          });
          if (!html || html.includes("katex-error"))
            throw new Error("KaTeX failed");
          return wrap(html, "KaTeX");
        } catch {
          try {
            const wrapper = document.createElement(
              displayMode ? "div" : "span"
            );
            wrapper.setAttribute("data-math", str);
            renderMathInElement(wrapper);
            return wrap(wrapper.outerHTML, "MathUp");
          } catch {
            return `<div class="math-render math-error" data-engine="None">[Math parse error]</div>`;
          }
        }
      }
    },
    convertMermaid() {
      const els = this.$el.querySelectorAll(".mermaid");
      if (!els.length) return;
      mermaid.initialize({startOnLoad: false});
      els.forEach((el) => {
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
.math-render,
.math-render * {
  font-size: 1.05rem !important;
  text-align: left !important;
  color: #111 !important;
  /* margin: 0.6em 0 !important;
  padding: 0.2em 0 !important;
  line-height: 1.6 !important;
  vertical-align: middle !important; */
  background: transparent !important;
  box-sizing: border-box;
}

[data-math],
[data-math] * {
  font-size: 1.05rem !important;
  text-align: left !important;
  color: #111 !important;
  margin: 0.6em 0 !important;
  padding: 0.2em 0 !important;
  line-height: 1.6 !important;
  vertical-align: middle !important;
  background: transparent !important;
  box-sizing: border-box;
}

.math-render.math-error {
  color: red !important;
  background: #fff0f0 !important;
  border-radius: 4px;
  padding: 0.5em !important;
  font-size: 1em !important;
}
</style>
