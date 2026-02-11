// src/utils/chatSearchOverlay.js
// Overlay search/highlight without mutating markdown DOM.
//
// Notes:
// - Scans text nodes under provided roots (defaults from SearchBar).
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

// === Search options (extensible) ===
// Keep this object extensible: add new flags here later.
export const DEFAULT_SEARCH_OPTIONS = {
  mode: "keyword", // keyword | regex
  caseSensitive: false,
  wholeWord: false,
  highlight: true,
  enableFirstLast: true,

  overlayWindow: 0, // active 기준 ±60 match만 하이라이트 렌더이며 0으로 설정하면 전체 하이라이트
  yieldEveryNodes: 250, // 텍스트 노드 250개마다 잠깐 쉬어서 UI 프리징 방지 0으로 설정하면 비활성화
};

export function mergeSearchOptions(user = {}) {
  return { ...DEFAULT_SEARCH_OPTIONS, ...(user || {}) };
}

export function ensureOverlayLayer(container) {
  if (!container) return null;
  const cs = window.getComputedStyle(container);
  if (cs.position === "static") container.style.position = "relative";

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

export async function scanMatchesAsync({
  roots,
  keyword,
  signal,
  // Backward-compat: allow direct caseSensitive flag
  caseSensitive = undefined,
  options = {},
}) {
  const out = [];
  const kRaw = String(keyword ?? "");
  if (!kRaw) return out;

  const opt = mergeSearchOptions(options);
  if (typeof caseSensitive === "boolean") opt.caseSensitive = caseSensitive;

  const mode = opt.mode || "keyword";
  const yieldEvery = Math.max(50, Number(opt.yieldEveryNodes || 250));

  let rx = null;
  if (mode === "regex") {
    try {
      const flags = opt.caseSensitive ? "g" : "gi";
      const body = opt.wholeWord ? `\\b(?:${kRaw})\\b` : kRaw;
      rx = new RegExp(body, flags);
    } catch {
      // Invalid regex => no matches
      return out;
    }
  }

  const kNorm = norm(kRaw, opt.caseSensitive);

  for (let i = 0; i < (roots || []).length; i++) {
    if (signal?.aborted) throw abortErr();
    const root = roots[i];
    if (!root) continue;

    // Let UI breathe between roots
    await sleep0();

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: acceptText,
    });

    let node;
    let seen = 0;

    while ((node = walker.nextNode())) {
      if (signal?.aborted) throw abortErr();

      // Yield periodically to keep UI responsive on huge DOMs
      if (++seen % yieldEvery === 0) await sleep0();

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

          // Prevent infinite loop on zero-length match
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

export function renderOverlay({
  container,
  matches,
  activeIndex = 0,
  highlight = true,
  options = {},
}) {
  const layer = ensureOverlayLayer(container);
  if (!layer) return;
  layer.innerHTML = "";
  if (!highlight || !matches?.length) return;

  const opt = mergeSearchOptions(options);
  const win = Math.max(0, Number(opt.overlayWindow ?? 60));
  const from = win ? Math.max(0, activeIndex - win) : 0;
  const to = win
    ? Math.min(matches.length - 1, activeIndex + win)
    : matches.length - 1;

  const cRect = container.getBoundingClientRect();

  for (let i = from; i <= to; i++) {
    const m = matches[i];
    if (!m?.node) continue;

    const r = rangeForMatch(m);
    const rects = Array.from(r.getClientRects());

    for (const rect of rects) {
      if (!rect || rect.width <= 0 || rect.height <= 0) continue;

      const d = document.createElement("div");
      d.className = "chat-search-hit" + (i === activeIndex ? " is-active" : "");
      d.style.position = "absolute";
      d.style.left = rect.left - cRect.left + container.scrollLeft + "px";
      d.style.top = rect.top - cRect.top + container.scrollTop + "px";
      d.style.width = rect.width + "px";
      d.style.height = rect.height + "px";
      d.style.borderRadius = "4px";
      // Keep colors here for consistent visibility across themes
      d.style.background =
        i === activeIndex
          ? "rgba(255, 190, 80, 0.70)"
          : "rgba(255, 225, 130, 0.55)";
      layer.appendChild(d);
    }
  }
}

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
  if (align === "center")
    targetTop = topInContainer - container.clientHeight / 2;
  else if (align === "start") targetTop = topInContainer - 8;
  else if (align === "end")
    targetTop = topInContainer - container.clientHeight + rect.height + 8;

  container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
}
