// src/utils/chatSearchOverlay.js
// Overlay search/highlight without mutating markdown DOM.

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
    layer.style.zIndex = "5";
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

export async function scanMatchesAsync({
  roots,
  keyword,
  signal,
  caseSensitive = false,
}) {
  const out = [];
  const kRaw = String(keyword ?? "");
  if (!kRaw) return out;

  const k = norm(kRaw, caseSensitive);

  for (let i = 0; i < roots.length; i++) {
    if (signal?.aborted) throw abortErr();
    const root = roots[i];
    if (!root) continue;

    await sleep0();

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: acceptText,
    });

    let node;
    while ((node = walker.nextNode())) {
      if (signal?.aborted) throw abortErr();
      const raw = node.nodeValue || "";
      const text = norm(raw, caseSensitive);

      let from = 0;
      while (true) {
        const idx = text.indexOf(k, from);
        if (idx === -1) break;
        out.push({
          node,
          start: idx,
          end: idx + kRaw.length,
          msgId: closestMsgId(node),
        });
        from = idx + Math.max(1, kRaw.length);
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
}) {
  const layer = ensureOverlayLayer(container);
  if (!layer) return;
  layer.innerHTML = "";
  if (!highlight || !matches?.length) return;

  const cRect = container.getBoundingClientRect();

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
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
      // Theme is handled via global CSS variables (no hard-coded colors here)
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
  align = "center", // start|center
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

  container.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
}
