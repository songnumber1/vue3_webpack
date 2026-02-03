import { reactive } from "vue";

let MAX_NOTES = 4;

export const noteStore = reactive({
  // slots
  slots: Array(MAX_NOTES).fill(null),

  // height for animation
  slotHeights: Array(MAX_NOTES).fill(0),

  // 🌍 전역 옵션
  options: {
    rotationDefault: false, // ✅ 기본 rotation ON
  },
});

export function setMaxNote(next) {
  const n = Number(next);
  if (!Number.isFinite(n) || n <= 0) return;

  noteStore.options.maxNotes = n;

  const alive = noteStore.slots.filter(Boolean);

  // 최신 n개 유지
  const kept = alive.sort((a, b) => a.id - b.id).slice(-n);

  noteStore.slots.length = 0;
  noteStore.slots.push(
    ...kept,
    ...Array(Math.max(0, n - kept.length)).fill(null),
  );
}

export function getMaxNote() {
  return noteStore.slots.length;
}

export function setOptionRotation(rotation) {
  noteStore.options.rotationDefault = rotation;
}

export function getOptionRotation() {
  return noteStore.options.rotationDefault;
}

export const INFO_SVG = `
<svg viewBox="0 0 24 24" width="18" height="18"
     fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="10" />
  <line x1="12" y1="10" x2="12" y2="16" />
  <circle cx="12" cy="7" r="1" fill="currentColor" />
</svg>`;

// WARNING: 채워진 삼각형 + 느낌표 (확실히 다름)
export const WARNING_SVG = `
<svg viewBox="0 0 24 24" width="18" height="18">
  <!-- solid triangle -->
  <path
    d="M12 2L1 22h22L12 2z"
    fill="currentColor"
  />

  <!-- exclamation bar -->
  <rect
    x="11"
    y="8"
    width="2"
    height="7"
    rx="1"
    fill="#fff"
  />

  <!-- exclamation dot -->
  <rect
    x="11"
    y="17"
    width="2"
    height="2"
    rx="1"
    fill="#fff"
  />
</svg>`;

// SUCCESS: 체크 원
export const SUCCESS_SVG = `
<svg viewBox="0 0 24 24" width="18" height="18"
     fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="10" />
  <polyline points="8 12 11 15 16 9" />
</svg>`;

// ERROR: X 원
export const ERROR_SVG = `
<svg viewBox="0 0 24 24" width="18" height="18"
     fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="10" />
  <line x1="8" y1="8" x2="16" y2="16" />
  <line x1="16" y1="8" x2="8" y2="16" />
</svg>`;

export const CLOSE_SVG = `
<svg viewBox="0 0 24 24" width="14" height="14"
     fill="none" stroke="currentColor" stroke-width="2"
     stroke-linecap="round">
  <line x1="6" y1="6" x2="18" y2="18" />
  <line x1="18" y1="6" x2="6" y2="18" />
</svg>`;
