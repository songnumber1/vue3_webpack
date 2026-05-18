import {logWarn} from "@/utils/logger";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
let mermaidLoader = null;

const MERMAID_CDN =
  "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";

/**
 * @description isDarkTheme 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function isDarkTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}

/**
 * @description getMermaidConfig 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getMermaidConfig() {
  const dark = isDarkTheme();

  return {
    startOnLoad: false,
    securityLevel: "strict",
    theme: "base",
    themeVariables: dark
      ? {
          background: "#212121",
          mainBkg: "#2f2f2f",
          secondBkg: "#343541",
          tertiaryBkg: "#111827",
          primaryColor: "#2f2f2f",
          primaryTextColor: "#f4f4f4",
          primaryBorderColor: "#9ca3af",
          secondaryColor: "#343541",
          secondaryTextColor: "#f4f4f4",
          secondaryBorderColor: "#9ca3af",
          tertiaryColor: "#111827",
          tertiaryTextColor: "#f4f4f4",
          tertiaryBorderColor: "#9ca3af",
          lineColor: "#e5e7eb",
          arrowheadColor: "#e5e7eb",
          edgeLabelBackground: "#111827",
          clusterBkg: "#262626",
          clusterBorder: "#9ca3af",
          nodeBorder: "#9ca3af",
          titleColor: "#f4f4f4",
          textColor: "#f4f4f4",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        }
      : {
          background: "#ffffff",
          mainBkg: "#ffffff",
          secondBkg: "#f7f7f8",
          tertiaryBkg: "#f3f4f6",
          primaryColor: "#ffffff",
          primaryTextColor: "#202123",
          primaryBorderColor: "#374151",
          secondaryColor: "#f7f7f8",
          secondaryTextColor: "#202123",
          secondaryBorderColor: "#374151",
          tertiaryColor: "#f3f4f6",
          tertiaryTextColor: "#202123",
          tertiaryBorderColor: "#374151",
          lineColor: "#374151",
          arrowheadColor: "#374151",
          edgeLabelBackground: "#ffffff",
          clusterBkg: "#f7f7f8",
          clusterBorder: "#374151",
          nodeBorder: "#374151",
          titleColor: "#202123",
          textColor: "#202123",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        },
  };
}

/**
 * @description loadScript 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} src - src 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (existing) {
      // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
      if (window.mermaid) {
        resolve();
        return;
      }
      existing.addEventListener("load", resolve, {once: true});
      existing.addEventListener("error", reject, {once: true});
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

/**
 * @description ensureMermaid 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
async function ensureMermaid() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (window.mermaid) {
    window.mermaid.initialize(getMermaidConfig());

    return window.mermaid;
  }

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!mermaidLoader) {
    mermaidLoader = loadScript(MERMAID_CDN)
      .then(() => window.mermaid)
      .catch((error) => {
        logWarn(
          "Mermaid could not be loaded. The source code block will remain visible.",
          error
        );

        return null;
      });
  }

  const mermaid = await mermaidLoader;
  mermaid?.initialize?.(getMermaidConfig());

  return mermaid;
}

/**
 * @description resetRenderedMermaid 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} root - root 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function resetRenderedMermaid(root) {
  const rendered = Array.from(
    root.querySelectorAll(".md-mermaid[data-processed]")
  );

  rendered.forEach((target) => {
    const source = target.getAttribute("data-mermaid-source");
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!source) return;

    target.removeAttribute("data-processed");
    target.setAttribute("data-mermaid-pending", "true");
    target.textContent = source;
  });
}

/**
 * @description renderMermaidInElement 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} root - root 입력값입니다.
 * @param {*} options - options 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export async function renderMermaidInElement(root, options = {}) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!root) return;

  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (options.force) {
    resetRenderedMermaid(root);
  }

  const targets = Array.from(
    root.querySelectorAll('.md-mermaid[data-mermaid-pending="true"]')
  );
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (targets.length === 0) return;

  targets.forEach((target) => {
    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!target.getAttribute("data-mermaid-source")) {
      target.setAttribute("data-mermaid-source", target.textContent || "");
    }
  });

  const mermaid = await ensureMermaid();
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!mermaid?.run) return;

  targets.forEach((target) => {
    target.removeAttribute("data-mermaid-pending");
    target.removeAttribute("data-mermaid-error");
  });

  // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
  try {
    await mermaid.run({nodes: targets});
  } catch (error) {
    logWarn("Mermaid rendering failed.", error);
    targets.forEach((target) => {
      const source =
        target.getAttribute("data-mermaid-source") || target.textContent || "";
      target.setAttribute("data-mermaid-error", "true");
      target.textContent = source;
    });
  }
}
