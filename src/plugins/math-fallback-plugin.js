import markdownItKatex from "markdown-it-katex";
import markdownItTemml from "markdown-it-math/temml";
import markdownItMathjax from "markdown-it-mathjax3";

let successfulEngine = null;
export function getSuccessfulMathEngine() {
  return successfulEngine;
}

export default function mathFallbackPlugin(md) {
  const fallbackEngines = [
    {name: "TEMML", fn: markdownItTemml, color: "green"},
    {name: "KaTeX", fn: markdownItKatex, color: "orange"},
    {name: "MathJax", fn: markdownItMathjax, color: "blue"},
  ];

  // 등록은 모두 시도
  for (const engine of fallbackEngines) {
    try {
      engine.fn(md);
      console.log(
        `%c[${engine.name}] 플러그인 등록 성공`,
        `color:${engine.color};font-weight:bold`
      );
    } catch (err) {
      console.warn(
        `%c[${engine.name}] 플러그인 실패: ${err.message}`,
        "color:red;font-weight:bold"
      );
    }
  }

  function tryRender(rules, tokens, idx, options, env, slf, type) {
    const content = tokens[idx].content;

    for (const engine of rules) {
      const renderer = engine.rule;
      if (typeof renderer !== "function") continue;

      // Temml이 지원하지 않을 가능성이 있는 문법이면 건너뜀
      if (
        engine.name === "TEMML" &&
        /\\(left|right|overset|underset|vec|int|bmatrix|cases|log|pi|mu|sigma|rightarrow|leftrightarrow)/.test(
          content
        )
      ) {
        console.warn(
          `%c[${engine.name}] ${type} 건너뜀 (비지원 문법 포함)`,
          "color:gray",
          {
            content,
          }
        );
        continue;
      }

      try {
        const html = renderer(tokens, idx, options, env, slf);
        if (!html || typeof html !== "string")
          throw new Error("렌더링 결과 없음");
        if (html.includes("ParseError")) throw new Error("ParseError");

        if (!successfulEngine) successfulEngine = engine.name;

        console.log(
          `%c[${engine.name}] ${type} 성공`,
          `color:${engine.color};font-weight:bold`,
          {
            content,
          }
        );

        return html;
      } catch (err) {
        console.warn(
          `%c[${engine.name}] ${type} 실패: ${err.message}`,
          "color:gray;font-style:italic"
        );
      }
    }

    return `<span style="color:red">[수학 렌더링 실패]</span>`;
  }

  // 엔진별 rule 백업
  const mathBlockRules = fallbackEngines.map((engine) => ({
    name: engine.name,
    color: engine.color,
    rule: md.renderer.rules.math_block,
  }));

  const mathInlineRules = fallbackEngines.map((engine) => ({
    name: engine.name,
    color: engine.color,
    rule: md.renderer.rules.math_inline,
  }));

  // 렌더링 오버라이드
  md.renderer.rules.math_block = function (tokens, idx, options, env, slf) {
    return tryRender(
      mathBlockRules,
      tokens,
      idx,
      options,
      env,
      slf,
      "math_block"
    );
  };

  md.renderer.rules.math_inline = function (tokens, idx, options, env, slf) {
    return tryRender(
      mathInlineRules,
      tokens,
      idx,
      options,
      env,
      slf,
      "math_inline"
    );
  };
}
