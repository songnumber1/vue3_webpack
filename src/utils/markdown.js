import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import markdownItKatex from "markdown-it-katex";

export const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  highlight(code, lang) {
    // mermaid는 highlight하지 않고 별도 렌더
    if (lang && lang.toLowerCase() === "mermaid") return "";
    if (lang && hljs.getLanguage(lang)) {
      return `<pre class="hljs"><code>${
        hljs.highlight(code, { language: lang }).value
      }</code></pre>`;
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(code)}</code></pre>`;
  },
}).use(markdownItKatex);

// ```mermaid 블록을 <div class="mermaid">...</div> 로 변환
const defaultFence = md.renderer.rules.fence;
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const info = (token.info || "").trim().toLowerCase();
  if (info === "mermaid") {
    // mermaid는 innerText 기반이 안정적이라 escapeHtml 유지
    const code = md.utils.escapeHtml(token.content || "");
    return `<div class="mermaid">${code}</div>`;
  }
  return defaultFence
    ? defaultFence(tokens, idx, options, env, self)
    : self.renderToken(tokens, idx, options);
};
