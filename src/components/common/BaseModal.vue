<template>
  <!-- Overlay -->
  <div class="modal-overlay">
    <vue-draggable-resizable
      class="vdr-modal"
      :x="x"
      :y="y"
      :w="modalSize.w"
      :h="modalSize.h"
      :draggable="draggable"
      :resizable="resizable"
      :handles="resizable ? ['br'] : []"
      drag-handle=".modal-header"
      :parent="false"
      :active="true"
      :prevent-deactivation="true"
    >
      <div class="modal">
        <!-- Header (drag handle only) -->
        <div class="modal-header" :class="{ disabled: !draggable }">
          <strong>{{ title }}</strong>
          <button class="close" type="button" @click="$emit('close')">×</button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <slot />
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <slot name="footer">
            <button @click="$emit('close')">Cancel</button>
            <button class="primary">Confirm</button>
          </slot>
        </div>
      </div>
    </vue-draggable-resizable>
  </div>
</template>

<script>
import VueDraggableResizable from "vue-draggable-resizable";
import "vue-draggable-resizable/style.css";

export default {
  name: "BaseModal",

  components: { VueDraggableResizable },

  props: {
    size: { type: String, default: "md" }, // sm | md | lg
    title: { type: String, default: "Modal" },

    draggable: { type: Boolean, default: true },
    resizable: { type: Boolean, default: true },
  },

  data() {
    return { x: 0, y: 0 };
  },

  computed: {
    modalSize() {
      const map = {
        sm: { w: 400, h: 260 },
        md: { w: 600, h: 420 },
        lg: { w: 900, h: 600 },
      };
      return map[this.size] || map.md;
    },
  },

  mounted() {
    this.center();
    window.addEventListener("resize", this.center);
  },

  beforeUnmount() {
    window.removeEventListener("resize", this.center);
  },

  methods: {
    center() {
      this.x = Math.max(
        0,
        Math.floor((window.innerWidth - this.modalSize.w) / 2)
      );
      this.y = Math.max(
        0,
        Math.floor((window.innerHeight - this.modalSize.h) / 2)
      );
    },
  },
};
</script>

<style scoped>
/* Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 9999;
}

/* vdr wrapper */
.vdr-modal {
  position: fixed !important;
  z-index: 10000 !important;
}

/* 점선/포커스 제거 (vdr 버전) */
:deep(.vdr),
:deep(.vdr:focus),
:deep(.vdr:focus-visible),
:deep(.vdr.active),
:deep(.vdr.dragging),
:deep(.vdr.resizing) {
  outline: none !important;
  border: none !important;
  box-shadow: none !important;
}

/* resize 핸들: 보이게 + 모양 제거 */
:deep(.vdr__handle),
:deep(.vdr__handle-br) {
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;

  background: transparent !important;
  border: none !important;
}

/* Modal */
.modal {
  width: 100%;
  height: 100%;
  background: #ffffff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}

/* Header */
.modal-header {
  height: 44px;
  padding: 0 12px;
  background: #f5f5f5;

  display: flex;
  justify-content: space-between;
  align-items: center;

  cursor: move;
  user-select: none;
}

.modal-header.disabled {
  cursor: default;
}

/* Body */
.modal-body {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

/* Footer */
.modal-footer {
  padding: 12px 16px;
  border-top: 1px solid #e5e5e5;

  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Buttons */
button {
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  cursor: pointer;
}

button.primary {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
}

/* Close button */
.close {
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}
</style>
