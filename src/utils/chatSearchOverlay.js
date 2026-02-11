/* eslint-disable no-continue */

const OVERLAY_CLASS = "chat-search-overlay-layer";

function abortErr() {
  return new DOMException("aborted", "AbortError");
}

function sleep0() {
  return new Promise((r) => setTimeout(r, 0));
}

function norm(s, caseSensitive) {
  const t = String(s ?? "");
  return caseSensitive ? t : t.toLowerCase();
}

/* =========================================================
   DEFAULT OPTIONS (overlayWindow 완전 제거)
========================================================= */
export const DEFAULT_SEARCH_OPTIONS = {
  mode: "keyword", // keyword | regex
  caseSensitive: false,
  wholeWord: false,
  highlight: true,
  enableFirstLast: true,
  yieldEveryNodes: 250, // UI 프리징 방지용
};

export function mergeSearchOptions(user = {}) {
  return { ...DEFAULT_SEARCH_OPTIONS, ...(user || {}) };
}

/* =========================================================
   Overlay Layer
========================================================= */
export function ensureOverlayLayer(container) {
  if (!container) return null;

  const cs = window.getComputedStyle(container);
  if (cs.position === "static") {
    container.style.position = "relative";
  }

  let layer = container.querySelector(`:scope > .${OVERLAY_CLASS}`);
  if (!layer) {
    layer = document.createElement("div");
    layer.className = OVERLAY_CLASS;
    layer.style.position = "absolute";
    layer.style.inset = "0";
    layer.style.pointerEvents = "none";
    layer.style.zIndex = "80";
    container.appendChild(layer);
  }

  return layer;
}

export function clearOverlay(container) {
  const layer = container?.querySelector?.(`:scope > .${OVERLAY_CLASS}`);
  if (layer) layer.innerHTML = "";
}

/* =========================================================
   Match Utilities
========================================================= */

function closestMsgId(textNode) {
  const el = textNode?.parentElement?.closest?.("[data-chat-msg-id]");
  return el?.getAttribute?.("data-chat-msg-id") || null;
}

function acceptText(node) {
  const v = node?.nodeValue;
  return v && v.trim().length
    ? NodeFilter.FILTER_ACCEPT
    : NodeFilter.FILTER_REJECT;
}

function rangeForMatch(m) {
  const r = document.createRange();
  r.setStart(m.node, m.start);
  r.setEnd(m.node, m.end);
  return r;
}

function isWordChar(ch) {
  return /[0-9A-Za-z_]/.test(ch || "");
}

function matchWholeWordAt(raw, start, end, wholeWord) {
  if (!wholeWord) return true;
  const prev = raw[start - 1];
  const next = raw[end];
  return !isWordChar(prev) && !isWordChar(next);
}

/* =========================================================
   MATCH SCAN (성능 안전 구조)
========================================================= */
export async function scanMatchesAsync({
  roots,
  keyword,
  signal,
  caseSensitive = undefined,
  options = {},
}) {
  const out = [];
  const kRaw = String(keyword ?? "");
  if (!kRaw) return out;

  const opt = mergeSearchOptions(options);
  if (typeof caseSensitive === "boolean") {
    opt.caseSensitive = caseSensitive;
  }

  const mode = opt.mode || "keyword";
  const yieldEvery = Math.max(50, Number(opt.yieldEveryNodes || 250));

  let rx = null;

  if (mode === "regex") {
    try {
      const flags = opt.caseSensitive ? "g" : "gi";
      const body = opt.wholeWord ? `\\b(?:${kRaw})\\b` : kRaw;
      rx = new RegExp(body, flags);
    } catch {
      return out; // invalid regex
    }
  }

  const kNorm = norm(kRaw, opt.caseSensitive);

  for (let i = 0; i < (roots || []).length; i++) {
    if (signal?.aborted) throw abortErr();
    const root = roots[i];
    if (!root) continue;

    await sleep0();

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: acceptText,
    });

    let node;
    let seen = 0;

    while ((node = walker.nextNode())) {
      if (signal?.aborted) throw abortErr();

      if (++seen % yieldEvery === 0) {
        await sleep0();
      }

      const raw = node.nodeValue || "";
      if (!raw) continue;

      if (rx) {
        rx.lastIndex = 0;
        let m;
        while ((m = rx.exec(raw))) {
          if (signal?.aborted) throw abortErr();

          const start = m.index;
          const len = m[0]?.length || 0;
          const end = start + len;
          if (end <= start) break;

          out.push({ node, start, end, msgId: closestMsgId(node) });

          if (rx.lastIndex === start) rx.lastIndex = start + 1;
        }
      } else {
        const text = norm(raw, opt.caseSensitive);
        let from = 0;

        while (true) {
          const idx = text.indexOf(kNorm, from);
          if (idx === -1) break;

          const start = idx;
          const end = idx + kRaw.length;

          if (matchWholeWordAt(raw, start, end, opt.wholeWord)) {
            out.push({ node, start, end, msgId: closestMsgId(node) });
          }

          from = idx + Math.max(1, kRaw.length);
        }
      }
    }
  }

  return out;
}

/* =========================================================
   VIEWPORT 기반 Overlay 렌더 (overlayWindow 제거)
========================================================= */
export function renderOverlay({
  container,
  matches,
  activeIndex = 0,
  highlight = true,
}) {
  const layer = ensureOverlayLayer(container);
  if (!layer) return;

  layer.innerHTML = "";
  if (!highlight || !matches?.length) return;

  const visibleTop = container.scrollTop;
  const visibleBottom = visibleTop + container.clientHeight;
  const cRect = container.getBoundingClientRect();

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (!m?.node) continue;

    const r = rangeForMatch(m);
    const rects = Array.from(r.getClientRects());

    for (const rect of rects) {
      if (!rect || rect.width <= 0 || rect.height <= 0) continue;

      const top = rect.top - cRect.top + container.scrollTop;

      // ✅ 현재 화면 안에 있는 것만 하이라이트
      if (top < visibleTop || top > visibleBottom) continue;

      const d = document.createElement("div");
      d.className = "chat-search-hit" + (i === activeIndex ? " is-active" : "");

      d.style.position = "absolute";
      d.style.left = rect.left - cRect.left + container.scrollLeft + "px";
      d.style.top = rect.top - cRect.top + container.scrollTop + "px";
      d.style.width = rect.width + "px";
      d.style.height = rect.height + "px";
      d.style.borderRadius = "4px";
      d.style.background =
        i === activeIndex
          ? "rgba(255, 190, 80, 0.70)"
          : "rgba(255, 225, 130, 0.55)";

      layer.appendChild(d);
    }
  }
}

/* =========================================================
   Navigation Helpers
========================================================= */
export function computeInitialIndex(matches, anchorMsgId) {
  if (!matches?.length) return 0;
  if (!anchorMsgId) return 0;
  const idx = matches.findIndex((m) => m.msgId === anchorMsgId);
  return idx >= 0 ? idx : 0;
}

export function scrollToMatch({
  container,
  matches,
  activeIndex,
  align = "center", // start|center|end
}) {
  const m = matches?.[activeIndex];
  if (!container || !m) return;

  const r = rangeForMatch(m);
  const rect = r.getBoundingClientRect();
  const cRect = container.getBoundingClientRect();

  const topInContainer = rect.top - cRect.top + container.scrollTop;

  let targetTop = topInContainer;

  if (align === "center") {
    targetTop = topInContainer - container.clientHeight / 2;
  } else if (align === "start") {
    targetTop = topInContainer - 8;
  } else if (align === "end") {
    targetTop = topInContainer - container.clientHeight + rect.height + 8;
  }

  container.scrollTo({
    top: Math.max(0, targetTop),
    behavior: "smooth",
  });
}
