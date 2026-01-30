// src/composables/useNote.js
import { readonly } from "vue";
import { noteStore, getMaxNote, getOptionRotation } from "@/storage/noteStore";

let seq = 0;

function addNote(payload = {}) {
  const {
    type = "info",
    title = "",
    content = "",
    duration = 5000,
    component = null,
    props = {},
    isRotation,
    priority,
  } = payload;

  const max = getMaxNote();

  const rotationEnabled =
    priority === "error" ||
    (isRotation !== undefined ? isRotation : getOptionRotation());

  const newNote = {
    id: ++seq,
    type,
    title,
    content,
    duration,
    priority,
    component,
    props,
  };

  // 1️⃣ 살아있는 note만 정리
  let alive = noteStore.slots.filter(Boolean);

  // 2️⃣ 가득 찬 경우 rotation
  if (alive.length >= max) {
    if (!rotationEnabled) return;

    alive = alive.sort((a, b) => a.id - b.id).slice(1); // oldest 제거
  }

  // 3️⃣ 새 note는 항상 마지막
  alive.push(newNote);

  // 4️⃣ 🔥 slots "교체 ❌ / 내용 수정 ⭕"
  noteStore.slots.splice(
    0,
    noteStore.slots.length,
    ...alive,
    ...Array(Math.max(0, max - alive.length)).fill(null),
  );
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
