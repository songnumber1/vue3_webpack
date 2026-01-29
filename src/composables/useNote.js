// src/core/note/useNote.js
import { readonly } from "vue";
// import { noteStore, MAX_NOTES } from "./noteStore";
import { noteStore, MAX_NOTES } from "@/storage/noteStore";

let seq = 0;

function addNote(payload = {}) {
  let lastUsedIndex = -1;

  for (let i = MAX_NOTES - 1; i >= 0; i--) {
    if (noteStore.slots[i] !== null) {
      lastUsedIndex = i;
      break;
    }
  }

  if (lastUsedIndex >= MAX_NOTES - 1) return;

  const nextIndex = lastUsedIndex + 1;

  noteStore.slots[nextIndex] = {
    id: ++seq,
    type: payload.type || "info",
    title: payload.title || "",
    content: payload.content || "",
    duration: payload.duration ?? 5000,

    component: payload.component || null,
    props: payload.props || {},
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
