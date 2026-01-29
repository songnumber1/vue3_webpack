<template>
  <div class="note-host">
    <div
      v-for="(note, idx) in slots"
      :key="`slot-${idx}`"
      class="note-slot"
      :style="{ minHeight: slotHeights[idx] + 'px' }"
    >
      <!-- Custom Note -->
      <component
        v-if="note && note.component"
        :is="note.component"
        v-bind="note.props || {}"
        @close="removeNote(note.id)"
        @height="setSlotHeight(idx, $event)"
      />

      <!-- Default Note -->
      <NoteItem
        v-else-if="note"
        :note="note"
        @close="removeNote(note.id)"
        @height="setSlotHeight(idx, $event)"
      />
    </div>
  </div>
</template>

<script>
import { useNote } from "@/composables/useNote";
import NoteItem from "@/components/note/NoteItem.vue";

export default {
  name: "NoteHost",
  components: { NoteItem },

  computed: {
    slots() {
      return useNote().slots;
    },
    slotHeights() {
      return useNote().slotHeights;
    },
  },

  methods: {
    removeNote(id) {
      useNote().removeNote(id);
    },
    setSlotHeight(idx, height) {
      useNote().setSlotHeight(idx, height);
    },
  },
};
</script>

<style>
.note-host {
  position: fixed;
  top: 112px;
  right: 20px;
  width: 288px;
  z-index: 9999;

  display: flex;
  flex-direction: column;
  gap: 18px;
}

.note-slot {
  width: 288px;
}
</style>
