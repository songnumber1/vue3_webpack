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

/**
 * Markdown AST node에서 순수 텍스트만 추출합니다.
 * 코드/mermaid 원문을 data attribute에 보관할 때 사용합니다.
 */
function textContent(node) {
  if (!node) return "";
  if (typeof node.value === "string") return node.value;
  if (!Array.isArray(node.children)) return "";

  return node.children.map(textContent).join("");
}
function mdLabel(key) {
  return i18n.global.t(key);
}
/**
 * rehype tree에 삽입할 table toolbar 버튼 node를 생성합니다.
 * 실제 copy/csv 동작은 렌더 후 DOM event 위임에서 처리됩니다.
 */
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

/**
 * mermaid card toolbar 버튼 node를 생성합니다.
 * copy/svg/code export 버튼은 markdown HTML 생성 단계에서 항상 같은 구조로 삽입됩니다.
 */
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

/**
 * code block toolbar 버튼 node를 생성합니다.
 * highlight 결과와 별도로 원본 코드는 dataMdCodeSource에 보관됩니다.
 */
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

/**
 * table을 toolbar + scroll wrapper가 있는 카드 구조로 변환합니다.
 * CSV 다운로드/복사 버튼을 붙이기 위해 원본 table node를 md-table-card 안으로 감쌉니다.
 */
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
/**
 * ```mermaid 코드 블록을 mermaid 렌더 대상 카드로 변환합니다.
 *
 * streaming 중에는 renderMermaid=false processor를 사용해 이 변환을 건너뛰고,
 * 답변 완료 후 renderMermaidInElement가 data-mermaid-pending 노드를 실제 SVG로 렌더합니다.
 */
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

/**
 * 일반 코드 블록을 toolbar가 있는 카드 구조로 변환합니다.
 * mermaid block은 앞 단계에서 변환되므로 여기서는 일반 pre > code만 처리합니다.
 */
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
                children: [
                  codeActionButton("copy", mdLabel("markdown.copyCode")),
                ],
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

/**
 * Markdown processor를 생성합니다.
 *
 * renderMermaid=false는 SSE streaming 중에 사용됩니다. 스트리밍 중 mermaid를 매 chunk마다
 * 렌더하면 비용이 크고 문법이 미완성일 수 있으므로, 완료 후 한 번만 렌더링합니다.
 */
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

/**
 * assistant/user message content를 HTML 문자열로 변환합니다.
 *
 * @param {string} text markdown 원문
 * @param {{renderMermaid?: boolean}} options renderMermaid=false면 mermaid 변환을 생략합니다.
 * @returns {Promise<string>} v-html에 전달할 HTML 문자열
 */
export async function renderMarkdown(text, options = {}) {
  const processor =
    options.renderMermaid === false ? streamingProcessor : defaultProcessor;
  const file = await processor.process(String(text ?? ""));
  const html = String(file).trim();

  return html || "<p></p>";
}
