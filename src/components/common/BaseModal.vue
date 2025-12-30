<template>
  <!-- Overlay -->
  <div class="modal-overlay">
    <vue-draggable-resizable
      :w="modalSize.w"
      :h="modalSize.h"
      :x="x"
      :y="y"
      :draggable="true"
      :resizable="true"
      :parent="false"
      class="vdr-modal"
    >
      <div class="modal">
        <div class="modal-header">
          <strong>{{ title }}</strong>
          <button class="close" type="button" @click="onCancel">×</button>
        </div>

        <div class="modal-body">
          <slot />
        </div>

        <div class="modal-footer">
          <button type="button" @click="onCancel">Cancel</button>
          <button type="button" class="primary" @click="onConfirm">
            Confirm
          </button>
        </div>
      </div>
    </vue-draggable-resizable>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import VueDraggableResizable from "vue-draggable-resizable";
import "vue-draggable-resizable/style.css";

// ✅ props를 변수로 받아야 함
const props = defineProps({
  size: { type: String, default: "md" },
  title: { type: String, default: "Modal" },
  onConfirm: Function,
  onCancel: Function,
});

const x = ref(120);
const y = ref(80);

const modalSize = computed(() => {
  return (
    {
      sm: { w: 400, h: 300 },
      md: { w: 600, h: 400 },
      lg: { w: 900, h: 600 },
    }[props.size] || { w: 600, h: 400 }
  );
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: rgba(0, 0, 0, 0.35);
}

.vdr-modal {
  position: fixed !important;
  z-index: 100000 !important;
}

.modal {
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 12px;
  background: #f5f5f5;
  cursor: move;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

.modal-footer {
  padding: 12px;
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.close {
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}
</style>
