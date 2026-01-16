import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import mermaid from "mermaid";

/* =========================
 * constants
 * ========================= */

export const SUPPORTED_MERMAID_TYPES = [
  "flowchart",
  "mindmap",
  "classdiagram",
  "sequencediagram",
  "statediagram",
  "erdiagram",
  "gantt",
  "treemap-beta",
];

/* =========================
 * utils
 * ========================= */

export function extractMermaidType(code) {
  if (!code) return "";

  const lines = String(code).split("\n");

  for (const raw of lines) {
    const line = raw.trim().toLowerCase();
    if (!line) continue;

    // frontmatter / config 제거
    if (line === "---") continue;
    if (line.startsWith("config:")) continue;

    return line.split(/\s+/)[0];
  }
  return "";
}

/* =========================
 * remark: AST gate (회사 방식)
 * ========================= */

export function remarkMermaidGate({ isCompleted } = {}) {
  return (tree, file) => {
    if (!isCompleted) return;

    file.data ||= {};
    file.data.mermaidFallbackStore ||= [];

    visit(tree, "code", (node, index, parent) => {
      if (!parent || node.lang !== "mermaid") return;

      const type = extractMermaidType(node.value);
      if (!SUPPORTED_MERMAID_TYPES.includes(type)) return;

      const fallbackIndex = file.data.mermaidFallbackStore.length;
      file.data.mermaidFallbackStore.push(node.value);

      // 🔥 텍스트 placeholder (회사 코드 핵심)
      parent.children[index] = {
        type: "paragraph",
        children: [
          {
            type: "text",
            value: `MERMAID_FALLBACK_${fallbackIndex}`,
          },
        ],
      };
    });
  };
}

/* =========================
 * processor
 * ========================= */

export function createProcessor({ isCompleted }) {
  return unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkMermaidGate, { isCompleted })
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex)
    .use(rehypeStringify, { allowDangerousHtml: true });
}

export async function convertMarkdownSafe({ markdown, isCompleted }) {
  const processor = createProcessor({ isCompleted });
  const file = await processor.process(markdown);

  return {
    html: String(file.value),
    file,
  };
}

/* =========================
 * mermaid runtime
 * ========================= */

let MERMAID_INIT = false;

export function initMermaid() {
  if (MERMAID_INIT) return;

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: "dark",
  });

  MERMAID_INIT = true;
}

/**
 * 회사 코드 방식:
 * - TEXT_NODE 기준 탐색
 * - index 기반
 * - Promise.all(batch) 안전
 * - 실패 시 코드블록 fallback
 */
export async function renderMermaidFromStore(
  rootEl,
  mermaidFallbackStore,
  { concurrency = 2 } = {}
) {
  if (!rootEl || !mermaidFallbackStore?.length) return [];

  const failedIndexes = [];
  const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, null);

  const tasks = [];
  let textNode;

  while ((textNode = walker.nextNode())) {
    const match = textNode.nodeValue?.match(/MERMAID_FALLBACK_(\d+)/);
    if (!match) continue;

    const index = Number(match[1]);
    const source = mermaidFallbackStore[index];
    if (!source) continue;

    textNode.nodeValue = "";

    const container = document.createElement("div");
    container.className = "mermaid";
    container.textContent = source;
    container.style.visibility = "hidden";

    textNode.parentNode.insertBefore(container, textNode.nextSibling);
    tasks.push({ index, container, source });
  }

  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);

    await Promise.all(
      batch.map(async ({ index, container, source }) => {
        try {
          await mermaid.run({ nodes: [container] });

          const svg = container.querySelector("svg");
          if (!svg || !isValidMermaidSvg(svg)) {
            throw new Error("Invalid mermaid output");
          }

          container.style.visibility = "visible";
        } catch {
          failedIndexes.push(index);

          container.className = "";
          container.innerHTML = "";
          container.appendChild(buildCodeblockElement(source));
          container.style.visibility = "visible";
        }
      })
    );

    await nextFrame();
  }

  return failedIndexes;
}

/* =========================
 * helpers
 * ========================= */

function isValidMermaidSvg(svg) {
  const hasViewBox = svg.hasAttribute("viewBox");

  const hasGraphContent =
    svg.querySelector("g") ||
    svg.querySelector("path") ||
    svg.querySelector("polygon") ||
    svg.querySelector("rect") ||
    svg.querySelector("text");

  return hasViewBox || hasGraphContent;
}

function buildCodeblockElement(source) {
  const wrapper = document.createElement("div");
  wrapper.className = "codeblock";

  /* ===== header ===== */
  const header = document.createElement("div");
  header.className = "codeblock-header";

  const lang = document.createElement("span");
  lang.className = "codeblock-lang";
  lang.textContent = "mermaid";

  const copyBtn = document.createElement("button");
  copyBtn.className = "codeblock-copy";
  copyBtn.textContent = "Copy";
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(source);
      copyBtn.textContent = "Copied";
      setTimeout(() => (copyBtn.textContent = "Copy"), 1000);
    } catch {}
  };

  header.appendChild(lang);
  header.appendChild(copyBtn);

  /* ===== code body ===== */
  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.className = "language-mermaid";

  const lines = String(source).replace(/\n$/, "").split("\n");

  lines.forEach((line, i) => {
    const lineRow = document.createElement("div");
    lineRow.className = "code-line";

    const lineNo = document.createElement("span");
    lineNo.className = "line-no";
    lineNo.textContent = String(i + 1);

    const lineCode = document.createElement("span");
    lineCode.className = "line-code";
    lineCode.textContent = line || "\u00A0"; // 빈 줄 유지

    lineRow.appendChild(lineNo);
    lineRow.appendChild(lineCode);
    code.appendChild(lineRow);
  });

  pre.appendChild(code);

  wrapper.appendChild(header);
  wrapper.appendChild(pre);

  return wrapper;
}

function nextFrame() {
  return new Promise((r) => requestAnimationFrame(r));
}
