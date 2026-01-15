import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import { visit } from "unist-util-visit";
import mermaid from "mermaid";

/* ================== constants ================== */

/**
 * runtime mermaid로만 처리할 diagram 타입
 * ❗ 여기에 없으면 무조건 코드블록
 */
export const RUNTIME_MERMAID_TYPES = [
  "flowchart",
  "mindmap",
  "classdiagram",
  "sequencediagram",
  "statediagram",
  "erdiagram",
  "gantt",
  "treemap-beta",
];

/* ================== utils ================== */

export function extractMermaidType(code) {
  if (!code) return "";
  const lines = String(code).split("\n");
  for (const l of lines) {
    const t = l.trim().toLowerCase();
    if (t) return t.split(/\s+/)[0];
  }
  return "";
}

/* ================== remark ================== */

export function remarkMermaidSplit({ isCompleted } = {}) {
  return (tree, file) => {
    file.data ??= {};
    file.data.mermaidFallbackStore ??= [];

    visit(tree, "code", (node, index, parent) => {
      if (!parent || node.lang !== "mermaid") return;
      if (isCompleted !== true) return;

      const code = node.value || "";
      const type = extractMermaidType(code);

      // ❌ 지원 안 함 → 코드블록
      if (!RUNTIME_MERMAID_TYPES.includes(type)) {
        parent.children.splice(index, 1, {
          type: "code",
          lang: "text",
          value: code,
        });
        return;
      }

      // ✅ runtime mermaid 대상
      const idx = file.data.mermaidFallbackStore.length;
      file.data.mermaidFallbackStore.push(code);

      parent.children.splice(index, 1, {
        type: "html",
        value: `<div class="mermaid-fallback" data-mermaid-index="${idx}"></div>`,
      });
    });
  };
}

/* ================== codeblock UI ================== */

export function rehypeCodeblockUI({ showLineNumbers = true } = {}) {
  return (tree) => {
    visitHast(tree, (node, index, parent) => {
      if (!parent || node.type !== "element" || node.tagName !== "pre") return;

      const codeEl = node.children?.find(
        (c) => c.type === "element" && c.tagName === "code"
      );
      if (!codeEl) return;

      const lang = extractLang(codeEl.properties?.className) || "text";
      const text = extractText(codeEl);

      parent.children[index] = makeCodeblock({
        lang,
        text,
        showLineNumbers,
      });
    });
  };
}

function makeCodeblock({ lang, text, showLineNumbers }) {
  const lines = String(text).replace(/\n$/, "").split("\n");

  return {
    type: "element",
    tagName: "div",
    properties: { className: ["codeblock"] },
    children: [
      {
        type: "element",
        tagName: "pre",
        children: [
          {
            type: "element",
            tagName: "code",
            properties: { className: [`language-${lang}`] },
            children: lines.map((line, i) => ({
              type: "element",
              tagName: "div",
              properties: { className: ["code-line"] },
              children: [
                ...(showLineNumbers
                  ? [
                      {
                        type: "element",
                        tagName: "span",
                        properties: { className: ["line-no"] },
                        children: [{ type: "text", value: String(i + 1) }],
                      },
                    ]
                  : []),
                {
                  type: "element",
                  tagName: "span",
                  properties: { className: ["line-code"] },
                  children: [{ type: "text", value: line }],
                },
              ],
            })),
          },
        ],
      },
    ],
  };
}

/* ================== processors ================== */

export function createStreamProcessor({ showLineNumbers = true } = {}) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath) // ⬅️ LaTeX 파싱
    .use(remarkMermaidSplit, { isCompleted: false })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex) // ⬅️ KaTeX 렌더
    .use(rehypeCodeblockUI, { showLineNumbers })
    .use(rehypeStringify, { allowDangerousHtml: true });
}

export function createCompletedProcessor({ showLineNumbers = true } = {}) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath) // ⬅️ LaTeX 파싱
    .use(remarkMermaidSplit, { isCompleted: true })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex) // ⬅️ KaTeX 렌더
    .use(rehypeCodeblockUI, { showLineNumbers })
    .use(rehypeStringify, { allowDangerousHtml: true });
}

/* ================== runtime ================== */

export function initMermaid() {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "dark",
  });
}

export async function renderRuntimeMermaid(rootEl, store) {
  if (!rootEl || !store?.length) return;

  const nodes = rootEl.querySelectorAll(".mermaid-fallback");

  for (const el of nodes) {
    const idx = Number(el.dataset.mermaidIndex);
    const source = store[idx];
    if (!source) continue;

    el.classList.add("mermaid");
    el.textContent = source;

    try {
      await mermaid.run({ nodes: [el] });
      el.classList.remove("mermaid-fallback");
    } catch {
      // ❗ 문법 오류 → 코드블록 fallback
      el.textContent = source;
      el.classList.add("code-only");
    }
  }
}

/* ================== helpers ================== */

function visitHast(tree, fn) {
  const stack = [{ node: tree, parent: null }];
  while (stack.length) {
    const { node, parent } = stack.pop();
    if (Array.isArray(node.children)) {
      for (const c of node.children) stack.push({ node: c, parent: node });
    }
    if (node.type === "element" && parent) {
      fn(node, parent.children.indexOf(node), parent);
    }
  }
}

function extractText(node) {
  let out = "";
  const stack = [...(node.children || [])];
  while (stack.length) {
    const n = stack.shift();
    if (n.type === "text") out += n.value || "";
    if (n.children) stack.unshift(...n.children);
  }
  return out;
}

function extractLang(className) {
  const list = Array.isArray(className) ? className : [className];
  for (const c of list) {
    const m = String(c).match(/language-([\w-]+)/);
    if (m) return m[1];
  }
  return "";
}

/* ================== safe convert ================== */

export async function convertMarkdownSafe({
  markdown,
  isCompleted,
  streamProcessor,
  completedProcessor,
}) {
  const processor = isCompleted ? completedProcessor : streamProcessor;

  try {
    const file = await processor.process(markdown);
    return { html: String(file.value || ""), file };
  } catch {
    return {
      html: `<pre>${markdown}</pre>`,
      file: { data: {} },
    };
  }
}
