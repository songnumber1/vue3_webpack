/**
 * @file utils/mermaidRenderer.js
 * @description 여러 영역에서 공유하는 유틸리티입니다. DOM/Markdown/feedback/viewport 보정 등 공통 처리를 담당합니다.
 */

import mermaid from "mermaid";
import {logWarn} from "@/utils/logger";
import {destroyOverlayScrollbar} from "@/platform/scroll/overlayScrollbarController";

// -----------------------------------------------------------------------------
// Render constants
// -----------------------------------------------------------------------------

const DEFAULT_MERMAID_RENDER_RETRY_COUNT = 0;
const DEFAULT_MERMAID_RENDER_RETRY_FRAME_GAP = 1;
const MERMAID_FONT_STACK =
  '"Roboto", "Noto Sans KR", Inter, ui-sans-serif, system-ui, Arial, sans-serif';

// -----------------------------------------------------------------------------
// Runtime and frame helpers
// -----------------------------------------------------------------------------

function isAndroidMermaidRuntime() {
  if (
    typeof document !== "undefined" &&
    document.body?.classList?.contains("actual-android-runtime")
  ) {
    return true;
  }

  if (typeof navigator === "undefined") {
    return false;
  }

  return /Android/i.test(navigator.userAgent || "");
}

function getMermaidFontFamily() {
  return MERMAID_FONT_STACK;
}

function waitAnimationFrames(frameCount = 1) {
  const count = Math.max(1, Number(frameCount) || 1);
  if (
    typeof window === "undefined" ||
    typeof window.requestAnimationFrame !== "function"
  ) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let remaining = count;
    const step = () => {
      remaining -= 1;
      if (remaining <= 0) {
        resolve();
        return;
      }
      window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  });
}

// -----------------------------------------------------------------------------
// Mermaid configuration
// -----------------------------------------------------------------------------

/**
 * [Mermaid 후처리 렌더러]
 * Markdown 단계에서 mermaid code block이 생성된 뒤 실제 SVG 변환을 수행합니다.
 * 스트림 중간 렌더는 문법이 완성되지 않은 상태일 수 있어 실패 가능성이 높으므로,
 * 보통 assistant message status가 complete 된 뒤 force 렌더로 다시 처리합니다.
 *
 * Mermaid는 npm dependency를 webpack bundle에 포함하여 사용합니다.
 */

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
          fontFamily: getMermaidFontFamily(),
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
          fontFamily: getMermaidFontFamily(),
        },
    fontFamily: getMermaidFontFamily(),
    flowchart: {
      htmlLabels: true,
      useMaxWidth: false,
      padding: 18,
    },
    sequence: {
      useMaxWidth: false,
      diagramMarginY: 14,
      boxTextMargin: 6,
    },
  };
}
/**
 * 번들에 포함된 Mermaid 모듈을 현재 테마 설정으로 초기화합니다.
 * 외부 script 주입이나 원격 fallback은 사용하지 않습니다.
 */
async function ensureMermaid() {
  if (!mermaid?.initialize) {
    return null;
  }

  mermaid.initialize(getMermaidConfig());
  return mermaid;
}

// -----------------------------------------------------------------------------
// Mermaid target state and source helpers
// -----------------------------------------------------------------------------

/**
 * mermaid render target이 속한 카드 wrapper를 찾습니다.
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

function normalizeMermaidSource(value = "") {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .trim();
}

function getMermaidSource(target) {
  return normalizeMermaidSource(
    target?.getAttribute?.("data-mermaid-source") || target?.textContent || ""
  );
}

function resetMermaidTargetToSource(target, source = getMermaidSource(target)) {
  if (!target) return;

  // PC에서는 OverlayScrollbars가 `.md-mermaid` 내부에 viewport/scrollbar DOM을 삽입합니다.
  // 그 상태에서 Mermaid가 element.innerHTML을 읽으면 실제 다이어그램 코드가 아니라
  // OverlayScrollbars wrapper HTML까지 함께 파싱하여 UnknownDiagramError가 발생합니다.
  // 렌더 직전에는 반드시 scrollbar 인스턴스를 제거하고 원본 source text만 남깁니다.
  destroyOverlayScrollbar(target);
  target.textContent = source || "";
}

function showMermaidSourceAsCode(target, source = getMermaidSource(target)) {
  if (!target) return;

  resetMermaidTargetToSource(target, source);
  target.removeAttribute("data-processed");
  target.removeAttribute("data-mermaid-pending");
  target.setAttribute("data-mermaid-error", "true");
  markMermaidCardState(target, "error");
}

// -----------------------------------------------------------------------------
// Mermaid validation helpers
// -----------------------------------------------------------------------------

function createMermaidRenderId() {
  const random = Math.random().toString(36).slice(2);
  return `ds-mermaid-${Date.now()}-${random}`;
}

function isMermaidErrorSvg(svg = "") {
  const normalized = String(svg || "").toLowerCase();

  return (
    !normalized ||
    normalized.includes("syntax error in text") ||
    normalized.includes("unknown diagram error") ||
    normalized.includes("no diagram type detected") ||
    normalized.includes("mermaid version")
  );
}

async function isMermaidSourceRenderable(mermaid, source) {
  if (!mermaid?.parse) return true;

  try {
    const result = await mermaid.parse(source, {suppressErrors: true});

    return result !== false;
  } catch (error) {
    logWarn(
      "Mermaid syntax validation failed. The source code block will remain visible.",
      error
    );

    return false;
  }
}

// -----------------------------------------------------------------------------
// SVG normalization helpers
// -----------------------------------------------------------------------------

function parseSvgNumber(value) {
  const match = String(value || "").match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;

  const number = Number(match[0]);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function parseSvgViewBox(svg) {
  const rawViewBox = svg?.getAttribute?.("viewBox");
  if (!rawViewBox) return null;

  const values = rawViewBox
    .split(/[\s,]+/)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (values.length !== 4 || values[2] <= 0 || values[3] <= 0) return null;

  return {x: values[0], y: values[1], width: values[2], height: values[3]};
}

function applyStableMermaidSvgSize(svg, viewBox) {
  if (!svg || !viewBox) return;

  const width = Math.max(1, Math.ceil(viewBox.width));
  const height = Math.max(1, Math.ceil(viewBox.height));

  svg.setAttribute(
    "viewBox",
    `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`
  );
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;
  svg.style.maxWidth = "none";
  svg.style.overflow = "visible";
  svg.style.display = "block";
  svg.style.fontFamily = MERMAID_FONT_STACK;
  svg.setAttribute("preserveAspectRatio", "xMinYMin meet");
}

function normalizeMermaidSvgBounds(target) {
  const svg = target?.querySelector?.("svg");
  if (!svg) return;

  svg.style.overflow = "visible";

  const baseViewBox = parseSvgViewBox(svg);
  const fallbackWidth = parseSvgNumber(
    svg.getAttribute("width") || svg.style.width
  );
  const fallbackHeight = parseSvgNumber(
    svg.getAttribute("height") || svg.style.height
  );
  let nextViewBox = baseViewBox || {
    x: 0,
    y: 0,
    width: fallbackWidth || svg.clientWidth || 1,
    height: fallbackHeight || svg.clientHeight || 1,
  };

  try {
    if (typeof svg.getBBox === "function") {
      const bbox = svg.getBBox();
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        const padding = 8;
        const minX = Math.min(nextViewBox.x, bbox.x) - padding;
        const minY = Math.min(nextViewBox.y, bbox.y) - padding;
        const maxX =
          Math.max(nextViewBox.x + nextViewBox.width, bbox.x + bbox.width) +
          padding;
        const maxY =
          Math.max(nextViewBox.y + nextViewBox.height, bbox.y + bbox.height) +
          padding;
        nextViewBox = {
          x: Math.floor(minX),
          y: Math.floor(minY),
          width: Math.ceil(maxX - minX),
          height: Math.ceil(maxY - minY),
        };
      }
    }
  } catch (error) {
    // 일부 Android WebView에서는 최초 paint 전 getBBox가 실패할 수 있습니다.
    // 이 경우 Mermaid가 제공한 viewBox/width/height를 그대로 사용합니다.
  }

  applyStableMermaidSvgSize(svg, nextViewBox);
}

function applyMermaidSvgTextGuards(target) {
  if (!target?.isConnected) return;

  const svg = target.querySelector("svg");
  if (!svg) return;

  target.setAttribute("data-mermaid-layout-normalized", "true");
  target.toggleAttribute(
    "data-mermaid-android-normalized",
    isAndroidMermaidRuntime()
  );

  svg
    .querySelectorAll(
      "text, tspan, .nodeLabel, .edgeLabel, .label, .actor, .messageText"
    )
    .forEach((node) => {
      node.style.fontFamily = MERMAID_FONT_STACK;
      node.style.overflow = "visible";
    });

  svg.querySelectorAll("foreignObject").forEach((node) => {
    node.style.overflow = "visible";
  });

  svg
    .querySelectorAll("foreignObject div, .nodeLabel, .edgeLabel, .label")
    .forEach((node) => {
      node.style.fontFamily = MERMAID_FONT_STACK;
      node.style.lineHeight = "1.32";
      node.style.overflow = "visible";
    });

  normalizeMermaidSvgBounds(target);
}

// -----------------------------------------------------------------------------
// Single target render flow
// -----------------------------------------------------------------------------

async function renderMermaidTargetWithRenderApi(mermaid, target) {
  if (!mermaid?.render || !target?.isConnected) return false;

  const source = getMermaidSource(target);
  if (!source) return false;

  resetMermaidTargetToSource(target, source);

  const isRenderable = await isMermaidSourceRenderable(mermaid, source);
  if (!isRenderable || !target.isConnected) return false;

  const renderId = createMermaidRenderId();
  const result = await mermaid.render(renderId, source);
  if (!target.isConnected) return false;

  if (isMermaidErrorSvg(result?.svg)) {
    return false;
  }

  target.innerHTML = result?.svg || "";
  applyMermaidSvgTextGuards(target);
  target.setAttribute("data-processed", "true");
  target.removeAttribute("data-mermaid-pending");
  target.removeAttribute("data-mermaid-error");

  if (typeof result?.bindFunctions === "function") {
    result.bindFunctions(target);
  }

  return Boolean(target.querySelector("svg"));
}

async function renderMermaidTargetWithRetries(mermaid, target, options = {}) {
  const retryCount = Math.max(
    DEFAULT_MERMAID_RENDER_RETRY_COUNT,
    Number(options.renderRetryCount) || 0
  );
  const retryFrameGap = Math.max(
    DEFAULT_MERMAID_RENDER_RETRY_FRAME_GAP,
    Number(options.renderRetryFrameGap) ||
      DEFAULT_MERMAID_RENDER_RETRY_FRAME_GAP
  );
  let lastError = null;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    if (!target?.isConnected) return false;

    try {
      const rendered = await renderMermaidTargetWithRenderApi(mermaid, target);
      if (rendered) return true;
    } catch (error) {
      lastError = error;
    }

    if (attempt < retryCount) {
      await waitAnimationFrames(retryFrameGap);
    }
  }

  if (lastError) {
    throw lastError;
  }

  return false;
}

// -----------------------------------------------------------------------------
// Batch render flow
// -----------------------------------------------------------------------------

async function renderMermaidTargetsWithRenderApi(
  mermaid,
  targets,
  options = {}
) {
  for (let index = 0; index < targets.length; index += 1) {
    const target = targets[index];
    if (!target.isConnected) continue;

    try {
      const rendered = await renderMermaidTargetWithRetries(
        mermaid,
        target,
        options
      );
      if (rendered) {
        markMermaidCardState(target, "rendered");
      } else {
        showMermaidSourceAsCode(target);
      }
    } catch (error) {
      showMermaidSourceAsCode(target);
      logWarn(
        "Mermaid rendering failed. The source code block will remain visible.",
        error
      );
    } finally {
      if (typeof options.onTargetComplete === "function") {
        await options.onTargetComplete(target, index + 1, targets.length);
      }
    }
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
    resetMermaidTargetToSource(target, source);
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
      target.setAttribute("data-mermaid-source", getMermaidSource(target));
    }
  });

  const mermaid = await ensureMermaid(options);
  const liveTargets = targets.filter((target) => target.isConnected);
  if (!liveTargets.length) return;

  if (!mermaid?.render) {
    liveTargets.forEach((target) => showMermaidSourceAsCode(target));
    return;
  }

  liveTargets.forEach((target) => {
    const source = getMermaidSource(target);
    if (source) {
      target.setAttribute("data-mermaid-source", source);
    }
    // Android 최초 진입에서는 첫 render 시도만 일시적으로 실패할 수 있습니다.
    // 성공이 확정되기 전까지 pending 상태를 유지하여 재시도 후에만 code fallback을 결정합니다.
    target.removeAttribute("data-mermaid-error");
    markMermaidCardState(target, "pending");
  });

  await renderMermaidTargetsWithRenderApi(mermaid, liveTargets, options);
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

export function fallbackPendingMermaidToCode(root) {
  if (!root) return;

  Array.from(
    root.querySelectorAll?.('.md-mermaid[data-mermaid-pending="true"]') || []
  )
    .filter((target) => target.isConnected)
    .forEach((target) => showMermaidSourceAsCode(target));
}

function isRenderableRoot(root) {
  if (!root) return false;
  if (typeof Node !== "undefined" && root.nodeType === Node.DOCUMENT_NODE)
    return true;
  return root.isConnected !== false;
}

/**
 * 채팅방 최초 진입 전에 번들 Mermaid 모듈을 현재 테마로 초기화합니다.
 * 외부 네트워크 로딩은 없으며, 실제 렌더링은 MessageList의 DOM 순서 처리에서 수행합니다.
 */
export function warmupMermaidForHistoryRender() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve(null);
  }

  return ensureMermaid();
}

export function renderMermaidInElement(root, options = {}) {
  if (!isRenderableRoot(root)) return Promise.resolve();

  // Mermaid는 전역 대기열을 두지 않습니다.
  // v-for로 만들어진 현재 DOM root 안의 pending block만 DOM 순서대로 렌더링하고,
  // 렌더링할 수 없으면 즉시 원본 코드 fallback으로 확정합니다.
  return renderMermaidTargets(root, options);
}
