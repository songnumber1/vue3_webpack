<template>
  <div class="note-host" :style="{ top: `${topOffset}px` }">
    <TransitionGroup name="note-shift" tag="div" class="note-stack">
      <div v-for="note in visibleNotes" :key="note.id" class="note-wrapper">
        <NoteItem :note="note" @close="removeNote(note.id)" />
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useNote } from "@/composables/useNote";
import NoteItem from "@/components/note/NoteItem.vue";

const { slots, removeNote } = useNote();

/**
 * 실제 표시되는 note만
 */
const visibleNotes = computed(() =>
  slots.filter(Boolean),
);

/**
 * Header 기준 top offset
 */
const topOffset = ref(20);

function calcTopOffset() {
  const header =
    document.querySelector("header") ||
    document.getElementById("app-header");

  if (!header) {
    topOffset.value = 20;
    return;
  }

  const rect = header.getBoundingClientRect();
  topOffset.value = rect.bottom + 20; // ✅ header 아래 정확히 20px
}

onMounted(() => {
  calcTopOffset();
  window.addEventListener("resize", calcTopOffset);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", calcTopOffset);
});
</script>

<style scoped>
.note-host {
  position: fixed;
  right: 20px;
  /* ✅ 우측 정확히 20px */
  width: 280px;
  z-index: 9999;
}

/* stack layout */
.note-stack {
  display: flex;
  flex-direction: column;
}

/* note 간격 */
.note-wrapper {
  margin-bottom: 18px;
}

.note-wrapper:last-child {
  margin-bottom: 0;
}
</style>
