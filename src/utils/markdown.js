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

function svgElement(children) {
  return {
    type: "element",
    tagName: "svg",
    properties: {
      className: ["md-mermaid-action-icon"],
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.7",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ariaHidden: "true",
      focusable: "false",
    },
    children,
  };
}

function svgPath(d) {
  return {
    type: "element",
    tagName: "path",
    properties: {d},
    children: [],
  };
}

function svgLine(x1, y1, x2, y2) {
  return {
    type: "element",
    tagName: "line",
    properties: {x1, y1, x2, y2},
    children: [],
  };
}

function svgPolyline(points) {
  return {
    type: "element",
    tagName: "polyline",
    properties: {points},
    children: [],
  };
}

function svgRect(x, y, width, height, rx = "2") {
  return {
    type: "element",
    tagName: "rect",
    properties: {x, y, width, height, rx, ry: rx},
    children: [],
  };
}

function mermaidIcon(action) {
  const icons = {
    copy: svgElement([
      svgRect("9", "9", "13", "13", "2"),
      svgPath("M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"),
    ]),
    svg: svgElement([
      svgPath("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"),
      svgPolyline("14 2 14 8 20 8"),
      svgPath("M12 18v-6"),
      svgPolyline("9 15 12 18 15 15"),
    ]),
    code: svgElement([
      svgPolyline("8 17 3 12 8 7"),
      svgPolyline("16 7 21 12 16 17"),
      svgLine("14", "4", "10", "20"),
    ]),
  };

  return icons[action] || icons.copy;
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
      mermaidIcon(action),
      {
        type: "element",
        tagName: "span",
        properties: {className: ["sr-only"]},
        children: [{type: "text", value: label}],
      },
    ],
  };
}

function codeActionButton(action, label) {
  return {
    type: "element",
    tagName: "button",
    properties: {
      type: "button",
      className: ["md-code-action", `md-code-action--${action}`],
      dataMdCodeAction: action,
      ariaLabel: label,
      title: label,
    },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: {
          className: ["md-code-action-icon", `md-code-action-icon--${action}`],
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
                  mermaidActionButton("copy", mdLabel("markdown.copyMermaid")),
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

function detectCodeLanguage(codeNode) {
  const classNames = codeNode?.properties?.className || [];
  const languageClass = classNames.find((item) =>
    String(item || "").startsWith("language-")
  );
  return languageClass ? languageClass.replace("language-", "") : "text";
}

function rehypeCodeBlockWrapper() {
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      if (!parent || typeof index !== "number") return;
      if (node.tagName !== "pre") return;

      const codeNode = node.children?.[0];
      if (codeNode?.tagName !== "code") return;

      const language = detectCodeLanguage(codeNode);
      const source = textContent(codeNode);
      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: {className: ["md-code-card"], dataMdCodeLanguage: language},
        children: [
          {
            type: "element",
            tagName: "div",
            properties: {className: ["md-code-toolbar"]},
            children: [
              {
                type: "element",
                tagName: "strong",
                properties: {className: ["md-code-title"]},
                children: [{type: "text", value: language || "text"}],
              },
              {
                type: "element",
                tagName: "div",
                properties: {className: ["md-code-actions"]},
                children: [codeActionButton("copy", mdLabel("markdown.copyCode"))],
              },
            ],
          },
          {
            ...node,
            properties: {
              ...(node.properties || {}),
              className: [...(node.properties?.className || []), "md-code-pre"],
              dataMdCodeSource: source,
            },
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

  nextProcessor.use(rehypeCodeBlockWrapper);

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
