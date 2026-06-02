/**
 * @file utils/mermaidRenderer.js
 * @description 여러 영역에서 공유하는 유틸리티입니다. DOM/Markdown/feedback/viewport 보정 등 공통 처리를 담당합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {logWarn} from "@/utils/logger";

/**
 * [Mermaid 후처리 렌더러]
 * Markdown 단계에서 mermaid code block이 생성된 뒤 실제 SVG 변환을 수행합니다.
 * 스트림 중간 렌더는 문법이 완성되지 않은 상태일 수 있어 실패 가능성이 높으므로,
 * 보통 assistant message status가 complete 된 뒤 force 렌더로 다시 처리합니다.
 */

let mermaidLoader = null;
let mermaidRenderQueue = Promise.resolve();

const MERMAID_CDN =
  "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
/**
 * 현재 document theme를 기준으로 mermaid themeVariables를 선택합니다.
 * 다크 테마에서 mermaid 기본 색상이 보이지 않는 문제를 방지합니다.
 */
function isDarkTheme() {
  return document.documentElement.getAttribute("data-theme") === "dark";
}
/**
 * 앱 테마에 맞는 mermaid 초기화 설정입니다.
 * securityLevel은 strict로 유지해 markdown 내 임의 HTML/script 실행을 막습니다.
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
          actorBkg: "#2f2f2f",
          actorBorder: "#d1d5db",
          actorTextColor: "#f4f4f4",
          signalColor: "#e5e7eb",
          signalTextColor: "#f4f4f4",
          labelBoxBkgColor: "#111827",
          labelBoxBorderColor: "#9ca3af",
          labelTextColor: "#f4f4f4",
          noteBkgColor: "#2f2f2f",
          noteBorderColor: "#9ca3af",
          noteTextColor: "#f4f4f4",
          loopTextColor: "#f4f4f4",
          activationBkgColor: "#374151",
          activationBorderColor: "#d1d5db",
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
          actorBkg: "#ffffff",
          actorBorder: "#374151",
          actorTextColor: "#202123",
          signalColor: "#374151",
          signalTextColor: "#202123",
          labelBoxBkgColor: "#ffffff",
          labelBoxBorderColor: "#374151",
          labelTextColor: "#202123",
          noteBkgColor: "#f7f7f8",
          noteBorderColor: "#374151",
          noteTextColor: "#202123",
          loopTextColor: "#202123",
          activationBkgColor: "#f3f4f6",
          activationBorderColor: "#374151",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        },
  };
}
/**
 * mermaid CDN script를 한 번만 주입합니다.
 * 이미 script tag가 있으면 기존 load/error 이벤트를 재사용합니다.
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
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
 * window.mermaid를 보장하고 현재 테마 설정으로 initialize합니다.
 * CDN 로딩 실패 시 raw mermaid code block을 그대로 유지하기 위해 null을 반환합니다.
 */
async function ensureMermaid() {
  if (window.mermaid) {
    window.mermaid.initialize(getMermaidConfig());

    return window.mermaid;
  }

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
 * 현재 runtime, route, 설정 값에 따라 사용할 값을 결정합니다.
 */
function resolveMermaidCard(target) {
  return target?.closest?.(".md-mermaid-card") || null;
}

/**
 * mermaid card의 렌더 상태를 data attribute로 표시합니다.
 * toolbar의 SVG export 버튼 표시/숨김 및 오류 스타일이 이 상태를 참조합니다.
 */
function markMermaidCardState(target, state) {
  const card = resolveMermaidCard(target);
  if (!card) return;

  card.removeAttribute("data-mermaid-rendered");
  card.removeAttribute("data-mermaid-error");

  if (state === "rendered") {
    card.setAttribute("data-mermaid-rendered", "true");
    return;
  }

  if (state === "error") {
    card.setAttribute("data-mermaid-error", "true");
  }
}

/**
 * 이미 렌더된 mermaid SVG를 원본 source text로 되돌립니다.
 * theme 변경이나 stream 완료 후 force render 시 같은 노드를 다시 렌더하기 위해 사용합니다.
 */
function resetRenderedMermaid(root) {
  const rendered = Array.from(
    root.querySelectorAll(".md-mermaid[data-processed]")
  );

  rendered.forEach((target) => {
    const source = target.getAttribute("data-mermaid-source");
    if (!source) return;

    target.removeAttribute("data-processed");
    target.setAttribute("data-mermaid-pending", "true");
    markMermaidCardState(target, "pending");
    target.textContent = source;
  });
}
/**
 * root 내부의 pending mermaid block을 실제 SVG로 렌더합니다.
 *
 * 답변 streaming 중에는 markdown 단계에서 mermaid 렌더를 지연하고,
 * stream 완료 후 이 함수가 `.md-mermaid[data-mermaid-pending="true"]` 노드만 찾아 처리합니다.
 *
 * @param {Element|Document|null} root 검색할 DOM root
 * @param {{force?: boolean}} options force=true면 기존 렌더 결과를 source text로 되돌린 뒤 재렌더합니다.
 */
async function renderMermaidTargets(root, options = {}) {
  if (!root) return;

  if (options.force) {
    resetRenderedMermaid(root);
  }

  const targets = Array.from(
    root.querySelectorAll('.md-mermaid[data-mermaid-pending="true"]')
  ).filter((target) => target.isConnected);
  if (targets.length === 0) return;

  targets.forEach((target) => {
    if (!target.getAttribute("data-mermaid-source")) {
      target.setAttribute("data-mermaid-source", target.textContent || "");
    }
  });

  const mermaid = await ensureMermaid();
  if (!mermaid?.run) return;

  const liveTargets = targets.filter((target) => target.isConnected);
  if (!liveTargets.length) return;

  liveTargets.forEach((target) => {
    target.removeAttribute("data-mermaid-pending");
    target.removeAttribute("data-mermaid-error");
    markMermaidCardState(target, "pending");
  });

  try {
    await mermaid.run({nodes: liveTargets});
    liveTargets.forEach((target) => {
      const hasRenderedSvg = Boolean(target.querySelector("svg"));
      markMermaidCardState(target, hasRenderedSvg ? "rendered" : "error");
    });
  } catch (error) {
    logWarn("Mermaid rendering failed.", error);
    liveTargets.forEach((target) => {
      const source =
        target.getAttribute("data-mermaid-source") || target.textContent || "";
      target.setAttribute("data-mermaid-error", "true");
      target.setAttribute("data-mermaid-pending", "true");
      markMermaidCardState(target, "error");
      target.textContent = source;
    });
  }
}

export function renderMermaidInElement(root, options = {}) {
  if (!root) return Promise.resolve();

  const job = mermaidRenderQueue
    .catch(() => {})
    .then(() => renderMermaidTargets(root, options));

  mermaidRenderQueue = job.catch(() => {});
  return job;
}
