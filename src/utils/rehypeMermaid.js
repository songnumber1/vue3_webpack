import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeRaw from "rehype-raw";
import rehypeMermaid from "rehype-mermaid";
import { visit } from "unist-util-visit";
import mermaid from "mermaid";

/* ================== constants ================== */

export const REHYPE_MERMAID_TYPES = ["flowchart"];
export const RUNTIME_MERMAID_TYPES = ["mindmap"];

/* ================== utils ================== */

export function extractMermaidType(code) {
  if (!code) return "";
  const lines = String(code).split("\n");

  if (lines[0]?.trim() === "---") {
    let end = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === "---") {
        end = i;
        break;
      }
    }
    if (end !== -1) {
      for (let j = end + 1; j < lines.length; j++) {
        const t = lines[j].trim().toLowerCase();
        if (t) return t.split(/\s+/)[0];
      }
    }
  }

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

      // stream 단계: AST 변경 금지
      if (isCompleted !== true) return;

      const code = node.value || "";
      const type = extractMermaidType(code);

      // 1️⃣ rehype-mermaid 대상 (허용)
      if (REHYPE_MERMAID_TYPES.includes(type)) {
        return;
      }

      // 2️⃣ runtime mermaid 대상
      if (RUNTIME_MERMAID_TYPES.includes(type)) {
        const idx = file.data.mermaidFallbackStore.length;
        file.data.mermaidFallbackStore.push(code);

        parent.children.splice(index, 1, {
          type: "html",
          value: `<div class="mermaid-fallback" data-mermaid-index="${idx}"></div>`,
        });
        return;
      }

      // 3️⃣ ❗ 미지원 타입 → 일반 코드블럭으로 강제 변환
      parent.children.splice(index, 1, {
        type: "code",
        lang: "text",
        value: code,
      });
    });
  };
}

/* ================== rehype ================== */

export function rehypeSafeMermaid({ fallbackRenderer } = {}) {
  const runMermaid = rehypeMermaid();

  return async (tree, file) => {
    try {
      await runMermaid(tree, file);
    } catch (err) {
      file.data.mermaidError = err;

      visit(tree, "element", (node, index, parent) => {
        if (
          parent &&
          node.tagName === "pre" &&
          node.children?.[0]?.tagName === "code" &&
          node.children[0].properties?.className?.includes("language-mermaid")
        ) {
          const code =
            node.children[0].children?.map((c) => c.value || "").join("") || "";

          parent.children[index] = {
            type: "raw",
            value: fallbackRenderer
              ? fallbackRenderer(code, err)
              : defaultFallbackHtml(code, err),
          };
        }
      });
    }
  };
}

function defaultFallbackHtml(code, err) {
  return `
<div class="mermaid-error">
  <strong>Mermaid error</strong>
  <pre>${escapeHtml(code)}</pre>
  <div>${escapeHtml(err?.message || "Unknown error")}</div>
</div>
`.trim();
}

function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
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

      const classList = toClassList(codeEl.properties?.className);
      const lang = extractLangFromClassList(classList) || "text";
      const text = extractText(codeEl);

      parent.children[index] = makeCodeblockElement({
        lang,
        text,
        showLineNumbers,
      });
    });
  };
}

function makeCodeblockElement({ lang, text, showLineNumbers }) {
  const lines = String(text).replace(/\n$/, "").split("\n");

  const lineNodes = lines.map((line, i) => ({
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
  }));

  return {
    type: "element",
    tagName: "div",
    properties: { className: ["codeblock"] },
    children: [
      {
        type: "element",
        tagName: "div",
        properties: { className: ["codeblock-header"] },
        children: [
          {
            type: "element",
            tagName: "span",
            properties: { className: ["codeblock-language"] },
            children: [{ type: "text", value: lang }],
          },
          {
            type: "element",
            tagName: "button",
            properties: {
              type: "button",
              className: ["codeblock-copy-btn"],
              "data-copy": "1",
            },
            children: [{ type: "text", value: "Copy" }],
          },
        ],
      },
      {
        type: "element",
        tagName: "pre",
        children: [
          {
            type: "element",
            tagName: "code",
            properties: { className: [`language-${lang}`, "code-lines"] },
            children: lineNodes,
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
    .use(remarkMath)
    .use(remarkMermaidSplit, { isCompleted: false })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeCodeblockUI, { showLineNumbers })
    .use(rehypeStringify, { allowDangerousHtml: true });
}

export function createCompletedProcessor({ showLineNumbers = true } = {}) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkMermaidSplit, { isCompleted: true })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSafeMermaid)
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
      el.textContent = source;
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

function toClassList(v) {
  return Array.isArray(v) ? v : v ? [v] : [];
}

function extractLangFromClassList(list) {
  for (const c of list) {
    const m = String(c).match(/language-([\w-]+)/);
    if (m) return m[1];
  }
  return "";
}

/**
 * markdown → html 변환을 안전하게 수행
 * - unified processor 실행
 * - file.data 접근 가능
 * - 에러 발생 시 fallback 처리
 */
export async function convertMarkdownSafe({
  markdown,
  isCompleted,
  streamProcessor,
  completedProcessor,
}) {
  const processor = isCompleted ? completedProcessor : streamProcessor;

  try {
    const file = await processor.process(markdown);
    return {
      html: String(file.value || ""),
      file,
    };
  } catch (err) {
    console.error("[convertMarkdownSafe] error", err);

    return {
      html: `
        <pre class="markdown-error">
${escapeHtml(markdown)}
        </pre>
      `,
      file: {
        data: {
          error: err,
        },
      },
    };
  }
}
