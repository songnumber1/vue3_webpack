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

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
/**
 * @description textContent 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} node - node 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function textContent(node) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!node) return "";
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (typeof node.value === "string") return node.value;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!Array.isArray(node.children)) return "";
  // 계산된 결과를 호출부로 반환합니다.
  return node.children.map(textContent).join("");
}

/**
 * @description mdLabel 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} key - key 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function mdLabel(key) {
  // 계산된 결과를 호출부로 반환합니다.
  return i18n.global.t(key);
}

/**
 * @description tableActionButton 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} action - action 입력값입니다.
 * @param {*} label - label 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function tableActionButton(action, label) {
  // 계산된 결과를 호출부로 반환합니다.
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

/**
 * @description rehypeTableWrapper 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function rehypeTableWrapper() {
  // 계산된 결과를 호출부로 반환합니다.
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (!parent || typeof index !== "number") return;
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
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
 * @description rehypeMermaidBlock 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function rehypeMermaidBlock() {
  // 계산된 결과를 호출부로 반환합니다.
  return (tree) => {
    visit(tree, "element", (node, index, parent) => {
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (!parent || typeof index !== "number") return;
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (node.tagName !== "pre") return;

      const codeNode = node.children?.[0];
      const classNames = codeNode?.properties?.className || [];
      const isMermaid =
        codeNode?.tagName === "code" && classNames.includes("language-mermaid");
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (!isMermaid) return;

      parent.children[index] = {
        type: "element",
        tagName: "div",
        properties: {
          className: ["mermaid", "md-mermaid"],
          "data-mermaid-pending": "true",
        },
        children: [{type: "text", value: textContent(codeNode)}],
      };
    });
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkRehype)
  .use(rehypeKatex, {throwOnError: false, strict: false})
  .use(rehypeHighlight, {ignoreMissing: true, detect: false})
  .use(rehypeTableWrapper)
  .use(rehypeMermaidBlock)
  .use(rehypeExternalLinks, {
    target: "_blank",
    rel: ["nofollow", "noopener", "noreferrer"],
  })
  .use(rehypeStringify);

/**
 * @description renderMarkdown 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} text - text 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function renderMarkdown(text) {
  const file = await processor.process(String(text ?? ""));
  const html = String(file).trim();
  // 계산된 결과를 호출부로 반환합니다.
  return html || "<p></p>";
}

/**
 * @description isMarkdownRenderable 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} value - value 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function isMarkdownRenderable(value) {
  // 계산된 결과를 호출부로 반환합니다.
  return value !== undefined && value !== null;
}
