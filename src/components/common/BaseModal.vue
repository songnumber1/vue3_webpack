<!-- src/components/common/BaseModal.vue -->
<template>
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
        <div class="modal-header" :class="{ disabled: !draggable }">
          <strong>{{ title }}</strong>
          <button class="close" @click="$emit('close')">×</button>
        </div>

        <div class="modal-body">
          <slot />
        </div>

        <div class="modal-footer">
          <slot name="footer">
            <button @click="$emit('close')">Cancel</button>
            <button class="btn btn-primary">Confirm</button>
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
    size: { type: String, default: "md" },
    title: { type: String, default: "Modal" },
    draggable: { type: Boolean, default: false },
    resizable: { type: Boolean, default: false },
  },

  data() {
    return { x: 0, y: 0, vw: window.innerWidth, vh: window.innerHeight };
  },

  computed: {
    modalSize() {
      // Responsive modal sizing (works well in mobile webview + desktop)
      const presets = {
        sm: { w: 420, h: 280 },
        md: { w: 720, h: 520 },
        lg: { w: 980, h: 680 },
      };
      const base = presets[this.size] || presets.md;

      // Keep margins for small screens
      const maxW = Math.max(320, this.vw - 24);
      const maxH = Math.max(260, this.vh - 24);

      const w = Math.min(base.w, maxW);
      const h = Math.min(base.h, maxH);

      return { w, h };
    },
  },

  mounted() {
    this.onResize();
    window.addEventListener("resize", this.onResize);
  },

  beforeUnmount() {
    window.removeEventListener("resize", this.onResize);
  },

  methods: {
    center() {
      this.x = Math.max(0, (window.innerWidth - this.modalSize.w) / 2);
      this.y = Math.max(0, (window.innerHeight - this.modalSize.h) / 2);
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
  background: var(--bg-surface, #ffffff);
  border-radius: var(--radius-md, 12px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}

/* Header */
.modal-header {
  height: var(--control-h, 44px);
  padding: 0 var(--space-3, 12px);
  background: color-mix(in srgb, var(--bg-elevated, #f5f5f5) 70%, transparent);

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
  padding: var(--space-4, 16px);
  overflow: auto;
}

/* Footer */
.modal-footer {
  padding: var(--space-3, 12px) var(--space-4, 16px);
  border-top: 1px solid var(--border, #e5e5e5);

  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Buttons */
button {
  padding: 0 var(--control-pad-x, 14px);
  height: var(--control-h, 44px);
  border-radius: var(--control-radius, 12px);
  border: 1px solid var(--border, #d1d5db);
  background: var(--bg-surface, #ffffff);
  cursor: pointer;
}

button.primary {
  background: var(--primary, #3b82f6);
  border-color: var(--primary, #3b82f6);
  color: var(--primary-contrast, #ffffff);
}

/* Close button */
.close {
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}
</style>
