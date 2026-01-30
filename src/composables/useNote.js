// src/composables/useNote.js
import { readonly } from "vue";
import { noteStore, MAX_NOTES } from "@/storage/noteStore";

let seq = 0;

function addNote(payload = {}) {
  const {
    type = "info",
    title = "",
    content = "",
    duration = 5000,
    component = null,
    props = {},

    // 옵션
    isRotation,
    priority,
  } = payload;

  const usedNotes = noteStore.slots.filter(Boolean);

  // 🔥 priority error는 무조건 밀어넣기
  const forceRotation = priority === "error";

  // rotation 결정
  const rotationEnabled =
    forceRotation ||
    (isRotation !== undefined ? isRotation : noteStore.options.rotationDefault);

  // 슬롯 가득 찬 경우
  if (usedNotes.length >= MAX_NOTES) {
    if (!rotationEnabled) return;

    // 가장 오래된 note 제거 (id 최소)
    const oldestId = Math.min(...usedNotes.map((n) => n.id));
    const removeIdx = noteStore.slots.findIndex((n) => n?.id === oldestId);

    if (removeIdx !== -1) {
      noteStore.slots.splice(removeIdx, 1);
      noteStore.slots.push(null);
    }
  }

  const nextIndex = noteStore.slots.findIndex((n) => n === null);
  if (nextIndex === -1) return;

  noteStore.slots[nextIndex] = {
    id: ++seq,
    type,
    title,
    content,
    duration,
    priority,
    component,
    props,
  };
}

function removeNote(id) {
  const idx = noteStore.slots.findIndex((n) => n?.id === id);
  if (idx !== -1) noteStore.slots[idx] = null;
}

function setSlotHeight(idx, height) {
  if (height > 0) noteStore.slotHeights[idx] = height;
}

export function useNote() {
  return {
    slots: readonly(noteStore.slots),
    slotHeights: readonly(noteStore.slotHeights),
    addNote,
    removeNote,
    setSlotHeight,
  };
}
