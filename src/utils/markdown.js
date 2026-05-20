import {unified} from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import rehypeExternalLinks from "rehype-external-links";
import rehypeHighlight from "rehype-highlight";
import {visit} from "unist-util-visit";
import {i18n} from "@/i18n";

function textContent(node) {
  if (!node) return "";
  if (typeof node.value === "string") return node.value;
  if (!Array.isArray(node.children)) return "";

  return node.children.map(textContent).join("");
}
function mdLabel(key) {
  return i18n.global.t(key);
}
function tableActionButton(action, label) {
  return {
    type: "element",
    tagName: "button",
    properties: {
      type: "button",
      className: ["md-table-action", `md-table-action--${action}`],
      dataMdTableAction: action,
      ariaLabel: label,
      title: label,
    },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: {
          className: [
            "md-table-action-icon",
            `md-table-action-icon--${action}`,
          ],
        },
        children: [],
      },
      {
        type: "element",
        tagName: "span",
        properties: {className: ["sr-only"]},
        children: [{type: "text", value: label}],
      },
    ],
  };
}

function mermaidActionButton(action, label) {
  return {
    type: "element",
    tagName: "button",
    properties: {
      type: "button",
      className: ["md-mermaid-action", `md-mermaid-action--${action}`],
      dataMdMermaidAction: action,
      ariaLabel: label,
      title: label,
    },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: {
          className: [
            "md-mermaid-action-icon",
            `md-mermaid-action-icon--${action}`,
          ],
        },
        children: [],
      },
      {
        type: "element",
        tagName: "span",
        properties: {className: ["sr-only"]},
        children: [{type: "text", value: label}],
      },
    ],
  };
}
function rehypeTableWrapper() {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (!parent || typeof index !== "number") return;
      if (node.tagName !== "table") return;

      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: {className: ["md-table-card"]},
        children: [
          {
            type: "element",
            tagName: "div",
            properties: {className: ["md-table-toolbar"]},
            children: [
              {
                type: "element",
                tagName: "strong",
                properties: {className: ["md-table-title"]},
                children: [{type: "text", value: mdLabel("markdown.table")}],
              },
              {
                type: "element",
                tagName: "div",
                properties: {className: ["md-table-actions"]},
                children: [
                  tableActionButton("copy", mdLabel("markdown.copyTable")),
                  tableActionButton("csv", mdLabel("markdown.downloadCsv")),
                ],
              },
            ],
          },
          {
            type: "element",
            tagName: "div",
            properties: {className: ["md-table-wrapper"]},
            children: [node],
          },
        ],
      };
    });
  };
}
function rehypeMermaidBlock() {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (!parent || typeof index !== "number") return;
      if (node.tagName !== "pre") return;

      const codeNode = node.children?.[0];
      const classNames = codeNode?.properties?.className || [];
      const isMermaid =
        codeNode?.tagName === "code" && classNames.includes("language-mermaid");
      if (!isMermaid) return;

      const source = textContent(codeNode);
      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: {className: ["md-mermaid-card"]},
        children: [
          {
            type: "element",
            tagName: "div",
            properties: {className: ["md-mermaid-toolbar"]},
            children: [
              {
                type: "element",
                tagName: "strong",
                properties: {className: ["md-mermaid-title"]},
                children: [{type: "text", value: "Mermaid"}],
              },
              {
                type: "element",
                tagName: "div",
                properties: {className: ["md-mermaid-actions"]},
                children: [
                  mermaidActionButton("svg", "SVG 저장"),
                  mermaidActionButton("code", "코드 내보내기"),
                ],
              },
            ],
          },
          {
            type: "element",
            tagName: "div",
            properties: {
              className: ["mermaid", "md-mermaid"],
              "data-mermaid-pending": "true",
              "data-mermaid-source": source,
            },
            children: [{type: "text", value: source}],
          },
        ],
      };
    });
  };
}

function createProcessor({renderMermaid = true} = {}) {
  const nextProcessor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeKatex, {throwOnError: false, strict: false})
    .use(rehypeHighlight, {ignoreMissing: true, detect: false})
    .use(rehypeTableWrapper);

  if (renderMermaid) {
    nextProcessor.use(rehypeMermaidBlock);
  }

  return nextProcessor
    .use(rehypeExternalLinks, {
      target: "_blank",
      rel: ["nofollow", "noopener", "noreferrer"],
    })
    .use(rehypeStringify);
}

const defaultProcessor = createProcessor({renderMermaid: true});
const streamingProcessor = createProcessor({renderMermaid: false});

export async function renderMarkdown(text, options = {}) {
  const processor = options.renderMermaid === false ? streamingProcessor : defaultProcessor;
  const file = await processor.process(String(text ?? ""));
  const html = String(file).trim();

  return html || "<p></p>";
}
export function isMarkdownRenderable(value) {
  return value !== undefined && value !== null;
}
