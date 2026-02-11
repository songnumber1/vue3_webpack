/* eslint-disable no-continue */ // continue 사용 허용

// overlay 레이어 클래스명
const OVERLAY_CLASS = "chat-search-overlay-layer";

// AbortController 취소용 에러 생성
function abortErr() {
  return new DOMException("aborted", "AbortError");
}

// UI 프리징 방지용 0ms sleep
function sleep0() {
  return new Promise((r) => setTimeout(r, 0));
}

// 대소문자 옵션에 따라 문자열 normalize
function norm(s, caseSensitive) {
  const t = String(s ?? "");
  return caseSensitive ? t : t.toLowerCase();
}

/* =========================================================
   기본 검색 옵션
========================================================= */
export const DEFAULT_SEARCH_OPTIONS = {
  mode: "keyword", // keyword | regex 모드
  caseSensitive: false, // 대소문자 구분 여부
  wholeWord: false, // 완전 단어 일치 여부
  highlight: true, // 하이라이트 표시 여부
  enableFirstLast: true, // 처음/마지막 버튼 사용 여부
  autoScrollOnSearch: false, // 검색 시 자동 스크롤 여부
  yieldEveryNodes: 250, // N개 노드마다 UI 양보
};

// 사용자 옵션 merge
export function mergeSearchOptions(user = {}) {
  return { ...DEFAULT_SEARCH_OPTIONS, ...(user || {}) };
}

/* =========================================================
   Overlay Layer 생성 / 제거
========================================================= */

// overlay 레이어 생성 (없으면 생성)
export function ensureOverlayLayer(container) {
  if (!container) return null;

  const cs = window.getComputedStyle(container);

  // container가 static이면 relative로 변경
  if (cs.position === "static") {
    container.style.position = "relative";
  }

  // 기존 overlay 존재 여부 확인
  let layer = container.querySelector(`:scope > .${OVERLAY_CLASS}`);

  if (!layer) {
    layer = document.createElement("div");
    layer.className = OVERLAY_CLASS;
    layer.style.position = "absolute"; // 절대 위치
    layer.style.inset = "0"; // 전체 영역 덮기
    layer.style.pointerEvents = "none"; // 클릭 이벤트 차단 안함
    layer.style.zIndex = "80"; // 상단 레이어
    container.appendChild(layer);
  }

  return layer;
}

// overlay 내용 초기화
export function clearOverlay(container) {
  const layer = container?.querySelector?.(`:scope > .${OVERLAY_CLASS}`);
  if (layer) layer.innerHTML = "";
}

/* =========================================================
   Match Utilities
========================================================= */

// 텍스트 노드가 속한 메시지 ID 찾기
function closestMsgId(textNode) {
  const el = textNode?.parentElement?.closest?.("[data-chat-msg-id]");
  return el?.getAttribute?.("data-chat-msg-id") || null;
}

// 공백만 있는 텍스트는 제외
function acceptText(node) {
  const v = node?.nodeValue;
  return v && v.trim().length
    ? NodeFilter.FILTER_ACCEPT
    : NodeFilter.FILTER_REJECT;
}

// 매칭 범위를 Range 객체로 생성
function rangeForMatch(m) {
  const r = document.createRange();
  r.setStart(m.node, m.start);
  r.setEnd(m.node, m.end);
  return r;
}

// 단어 문자 판별 (wholeWord용)
function isWordChar(ch) {
  return /[0-9A-Za-z_]/.test(ch || "");
}

// 완전 단어 일치 여부 검사
function matchWholeWordAt(raw, start, end, wholeWord) {
  if (!wholeWord) return true;
  const prev = raw[start - 1];
  const next = raw[end];
  return !isWordChar(prev) && !isWordChar(next);
}

/* =========================================================
   비동기 DOM 스캔 (UI 멈춤 방지 구조)
========================================================= */
export async function scanMatchesAsync({
  roots,
  keyword,
  signal,
  caseSensitive = undefined,
  options = {},
}) {
  const out = []; // 매칭 결과 배열
  const kRaw = String(keyword ?? ""); // 검색어 문자열
  if (!kRaw) return out;

  const opt = mergeSearchOptions(options);

  // 외부 caseSensitive 직접 전달 시 override
  if (typeof caseSensitive === "boolean") {
    opt.caseSensitive = caseSensitive;
  }

  const mode = opt.mode || "keyword";
  const yieldEvery = Math.max(50, Number(opt.yieldEveryNodes || 250));

  let rx = null;

  // REGEX 모드 처리
  if (mode === "regex") {
    try {
      const flags = opt.caseSensitive ? "g" : "gi";
      const body = opt.wholeWord ? `\\b(?:${kRaw})\\b` : kRaw;
      rx = new RegExp(body, flags);
    } catch {
      return out; // 잘못된 정규식이면 종료
    }
  }

  const kNorm = norm(kRaw, opt.caseSensitive);

  // 루트별 DOM 순회
  for (let i = 0; i < (roots || []).length; i++) {
    if (signal?.aborted) throw abortErr();

    const root = roots[i];
    if (!root) continue;

    await sleep0(); // 루트 단위로 UI 양보

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: acceptText,
    });

    let node;
    let seen = 0;

    while ((node = walker.nextNode())) {
      if (signal?.aborted) throw abortErr();

      // N개 노드마다 UI 양보
      if (++seen % yieldEvery === 0) {
        await sleep0();
      }

      const raw = node.nodeValue || "";
      if (!raw) continue;

      // REGEX 검색
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

          // 무한루프 방지
          if (rx.lastIndex === start) rx.lastIndex = start + 1;
        }
      }
      // KEYWORD 검색
      else {
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

  return out; // 전체 매칭 반환
}

/* =========================================================
   Viewport 기준 Overlay 렌더
   - 현재 화면에 보이는 매칭만 표시
========================================================= */
export function renderOverlay({
  container,
  matches,
  activeIndex = 0,
  highlight = true,
}) {
  const layer = ensureOverlayLayer(container);
  if (!layer) return;

  layer.innerHTML = ""; // 기존 overlay 제거

  if (!highlight || !matches?.length) return;

  const visibleTop = container.scrollTop; // 화면 상단
  const visibleBottom = visibleTop + container.clientHeight; // 화면 하단
  const cRect = container.getBoundingClientRect();

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (!m?.node) continue;

    const r = rangeForMatch(m);
    const rects = Array.from(r.getClientRects());

    for (const rect of rects) {
      if (!rect || rect.width <= 0 || rect.height <= 0) continue;

      const top = rect.top - cRect.top + container.scrollTop;

      // 현재 화면에 보이지 않으면 skip
      if (top < visibleTop || top > visibleBottom) continue;

      const d = document.createElement("div");
      d.className = "chat-search-hit" + (i === activeIndex ? " is-active" : "");

      // 위치 계산
      d.style.position = "absolute";
      d.style.left = rect.left - cRect.left + container.scrollLeft + "px";
      d.style.top = rect.top - cRect.top + container.scrollTop + "px";
      d.style.width = rect.width + "px";
      d.style.height = rect.height + "px";

      // 색상 설정 (active 강조)
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

// anchorMsgId 기준 초기 인덱스 계산
export function computeInitialIndex(matches, anchorMsgId) {
  if (!matches?.length) return 0;
  if (!anchorMsgId) return 0;

  const idx = matches.findIndex((m) => m.msgId === anchorMsgId);
  return idx >= 0 ? idx : 0;
}

// 특정 매칭 위치로 스크롤 이동
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

// 현재 화면에 보이는 첫 매칭 인덱스 계산
export function computeViewportIndex(container, matches) {
  if (!container || !matches?.length) return 0;

  const visibleTop = container.scrollTop;
  const visibleBottom = visibleTop + container.clientHeight;
  const cRect = container.getBoundingClientRect();

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (!m?.node) continue;

    const r = document.createRange();
    r.setStart(m.node, m.start);
    r.setEnd(m.node, m.end);

    const rect = r.getBoundingClientRect();
    const top = rect.top - cRect.top + container.scrollTop;

    // 화면 안에 보이면 해당 index 반환
    if (top >= visibleTop && top <= visibleBottom) {
      return i;
    }
  }

  return 0; // 화면에 없으면 0 반환
}
