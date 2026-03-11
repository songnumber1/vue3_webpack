import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import rehypeHighlight from "rehype-highlight";
import { visit } from "unist-util-visit";
import { createMarkdownDollarPlugin } from "@/plugins/markdownDollarPlugin";

/**
 * Markdown $ normalize plugin
 */
const dollarPlugin = createMarkdownDollarPlugin({
  mathOddApply: true,
});

/**
 * rehype plugin: convert ```mermaid blocks into <div class="mermaid">
 */
function rehypeMermaidBlocks() {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (!parent || typeof index !== "number") return;
      if (node.tagName !== "pre") return;

      const code = (node.children || []).find(
        (c) => c.type === "element" && c.tagName === "code",
      );

      if (!code) return;

      const className = code.properties?.className || [];
      const classes = Array.isArray(className) ? className : [className];

      const isMermaid = classes.some((c) =>
        String(c).toLowerCase().includes("mermaid"),
      );

      if (!isMermaid) return;

      const text = (code.children || [])
        .filter((c) => c.type === "text")
        .map((c) => c.value || "")
        .join("");

      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["mermaid"] },
        children: [{ type: "text", value: text }],
      };
    });
  };
}

/**
 * rehype plugin: wrap tables with action buttons
 */
function rehypeTableActions() {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (!parent || typeof index !== "number") return;
      if (node.tagName !== "table") return;

      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: { className: ["md-table"] },
        children: [
          {
            type: "element",
            tagName: "div",
            properties: { className: ["md-table-actions"] },
            children: [
              {
                type: "element",
                tagName: "button",
                properties: {
                  type: "button",
                  className: ["md-btn"],
                  "data-md-table": "copy",
                },
                children: [{ type: "text", value: "표 복사" }],
              },
              {
                type: "element",
                tagName: "button",
                properties: {
                  type: "button",
                  className: ["md-btn"],
                  "data-md-table": "csv",
                },
                children: [{ type: "text", value: "CSV 내보내기" }],
              },
            ],
          },
          {
            type: "element",
            tagName: "div",
            properties: { className: ["md-table-scroll"] },
            children: [node],
          },
        ],
      };
    });
  };
}

/**
 * unified processor
 */
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm, { singleTilde: false })
  .use(remarkMath)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeMermaidBlocks)
  .use(rehypeHighlight, { ignoreMissing: true })
  .use(rehypeKatex, { output: "mathml" })
  .use(rehypeTableActions)
  .use(rehypeStringify);

// true
// input: 요청하신 내용: $100 $200 $
// normalized: $100$200 $

// false
// input: 요청하신 내용: $100 $200 $
// normalized: $100$200 $

/**
 * Markdown → HTML renderer
 */
export function renderMarkdown(text) {
  const normalized = dollarPlugin.process(String(text ?? ""));

  console.log("input:", text);
  console.log("normalized:", normalized);

  console.log("processor:", processor.processSync(normalized).toString());
  return processor.processSync(normalized).toString();
  // return processor.processSync(text).toString();
}

/**
 * Mermaid rendering helpers
 */
let _mermaid;
let _mermaidReady = false;

export async function initMermaidOnce() {
  if (_mermaidReady) return;

  const mod = await import("mermaid");
  _mermaid = mod.default || mod;

  _mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
  });

  _mermaidReady = true;
}

export async function runMermaidWithin(containerEl) {
  if (!containerEl) return;

  await initMermaidOnce();

  const nodes = Array.from(containerEl.querySelectorAll(".mermaid"));
  if (!nodes.length) return;

  try {
    await _mermaid.run({ nodes });
  } catch (e) {
    console.warn("[mermaid] render failed", e);
  }
}
