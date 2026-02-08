<template>
  <div class="note-host" :style="{ top: `${topOffset}px` }">
    <TransitionGroup name="note-shift" tag="div" class="note-stack">
      <div v-for="note in visibleNotes" :key="note.id" class="note-wrapper">
        <NoteItem :note="note" @close="removeNote(note.id)" />
      </div>
    </TransitionGroup>
  </div>
</template>

<script>
import NoteItem from "@/components/note/NoteItem.vue";
import { useNote } from "@/composables/useNote";

export default {
  name: "NoteHost",
  components: { NoteItem },

  data() {
    return {
      topOffset: 20,
      noteApi: null,
      _onResize: null,
    };
  },

  computed: {
    slots() {
      // noteApi가 준비되기 전 안전 가드
      return this.noteApi?.slots || [];
    },
    visibleNotes() {
      return (this.slots || []).filter(Boolean);
    },
  },

  created() {
    // 전역 note store 연결
    this.noteApi = useNote();
  },

  mounted() {
    this.calcTopOffset();
    this._onResize = () => this.calcTopOffset();
    window.addEventListener("resize", this._onResize);
  },

  beforeUnmount() {
    if (this._onResize) {
      window.removeEventListener("resize", this._onResize);
      this._onResize = null;
    }
  },

  methods: {
    removeNote(id) {
      this.noteApi?.removeNote?.(id);
    },

    calcTopOffset() {
      const header =
        document.querySelector("header") ||
        document.getElementById("app-header");

      if (!header) {
        this.topOffset = 20;
        return;
      }

      const rect = header.getBoundingClientRect();
      this.topOffset = rect.bottom + 20; // ✅ header 아래 정확히 20px
    },
  },
};
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


@media (max-width: 520px) {
  .note-host {
    left: 12px;
    right: 12px;
    width: auto;
  }
  .note-wrapper {
    margin-bottom: 12px;
  }
}
</style>
