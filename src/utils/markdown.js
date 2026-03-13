import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypeStringify from "rehype-stringify";
import rehypeHighlight from "rehype-highlight";
import { visit } from "unist-util-visit";

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
  const normalized = preprocessAnswer(text);

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

/**
 * preprocessAnswer
 *
 * 목적
 * --------------------------------------------------
 * AI 응답을 markdown parser(rehype / remark / KaTeX) 실행 전에 정리
 *
 * 주요 기능
 * --------------------------------------------------
 * 1. currency 변환
 *    $200 → ＄200
 *    $200 million → ＄200 million
 *
 * 2. math 보호
 *    $x+y$
 *    $5\sqrt{2}$
 *
 * 3. markdown 보호
 *    code block
 *    inline code
 *    URL
 *    template literal
 *
 * 4. KaTeX escape
 *    % → \%
 */

export function preprocessAnswer(text, options = {}) {
  const { escapeChars = ["%"], debug = false } = options;

  if (!text) return text;

  let result = "";
  let i = 0;

  let inCodeBlock = false;
  let inInlineCode = false;

  while (i < text.length) {
    const char = text[i];

    /**
     * --------------------------------------------------
     * code block 보호
     *
     * ```
     * code
     * ```
     * --------------------------------------------------
     */
    if (text.startsWith("```", i)) {
      inCodeBlock = !inCodeBlock;
      result += "```";
      i += 3;
      continue;
    }

    if (inCodeBlock) {
      result += char;
      i++;
      continue;
    }

    /**
     * --------------------------------------------------
     * inline code 보호
     *
     * `code`
     * --------------------------------------------------
     */
    if (char === "`") {
      inInlineCode = !inInlineCode;
      result += char;
      i++;
      continue;
    }

    if (inInlineCode) {
      result += char;
      i++;
      continue;
    }

    /**
     * --------------------------------------------------
     * $ 처리 시작
     * --------------------------------------------------
     */
    if (char === "$") {
      const next = text[i + 1];

      /**
       * template literal 보호
       *
       * ${value}
       */
      if (next === "{") {
        result += "$";
        i++;
        continue;
      }

      /**
       * URL 보호
       *
       * https://example.com/$value
       */
      const before = result.slice(-20);

      if (/https?:\/\/\S*$/.test(before)) {
        result += "$";
        i++;
        continue;
      }

      /**
       * --------------------------------------------------
       * 수식 여부 검사
       *
       * $x+y$
       * $5\sqrt{2}$
       * --------------------------------------------------
       */
      const nextDollar = text.indexOf("$", i + 1);

      if (nextDollar !== -1) {
        const inside = text.substring(i + 1, nextDollar);

        /**
         * 수식 판단
         *
         * 연산자 또는 latex 명령어 포함
         */
        if (/[+\-*/=^]/.test(inside) || /\\[a-zA-Z]+/.test(inside)) {
          result += "$" + inside + "$";
          i = nextDollar + 1;
          continue;
        }
      }

      /**
       * --------------------------------------------------
       * currency 검사
       * --------------------------------------------------
       */

      const after = text.substring(i + 1).trimStart();

      const tokens = after.split(/\s+/);

      const firstToken = tokens[0] || "";

      /**
       * punctuation 제거
       *
       * million,
       * million.
       * million...
       * million's
       */
      const secondTokenRaw = tokens[1] || "";

      const secondToken = secondTokenRaw.match(/[a-zA-Z가-힣]+/)?.[0] || "";

      /**
       * 숫자 패턴
       */
      const numberRegex = /^[+-]?[0-9][0-9,.]*/;

      /**
       * 연산자
       */
      const mathOperatorRegex = /[+\-*/=^]/;

      /**
       * 단어
       */
      const wordRegex = /^[a-zA-Z가-힣]+$/;

      /**
       * --------------------------------------------------
       * currency case 1
       *
       * $200 million
       * $200 dollars
       */
      if (
        numberRegex.test(firstToken) &&
        secondToken &&
        wordRegex.test(secondToken) &&
        !mathOperatorRegex.test(secondToken)
      ) {
        if (debug) {
          console.log("currency detected:", firstToken, secondToken);
        }

        result += "＄";
        i++;
        continue;
      }

      /**
       * --------------------------------------------------
       * currency case 2
       *
       * $200
       */
      if (numberRegex.test(firstToken)) {
        if (debug) {
          console.log("currency detected:", firstToken);
        }

        result += "＄";
        i++;
        continue;
      }

      /**
       * 일반 $
       */
      result += "$";
      i++;
      continue;
    }

    result += char;
    i++;
  }

  /**
   * --------------------------------------------------
   * KaTeX escape
   *
   * % → \%
   * --------------------------------------------------
   */

  escapeChars.forEach((c) => {
    const regex = new RegExp(`(?<!\\\\)\\${c}`, "g");

    result = result.replace(regex, "\\" + c);
  });

  if (debug) {
    console.log("==== preprocess end ====");
    console.log(result);
  }

  return result;
}
