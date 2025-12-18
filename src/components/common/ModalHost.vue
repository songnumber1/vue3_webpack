<template>
  <teleport to="body">
    <div v-if="state.visible" class="modal-backdrop" @click.self="onCancel">
      <div class="modal" :class="sizeClass">
        <component :is="state.component" v-bind="state.props" />
      </div>
    </div>
  </teleport>
</template>

<script>
import { useModalManager } from "@/plugins/modalManager";

export default {
  name: "ModalHost",
  setup() {
    const { state } = useModalManager();
    return { state };
  },
  computed: {
    sizeClass() {
      if (this.$responsive?.isSm?.()) return "mobile";
      return this.state.size;
    },
  },
  methods: {
    onCancel() {
      // backdrop 클릭 = 취소
      this.state.props?.onCancel?.();
    },
  },
};
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-surface);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow: hidden;
}

.modal.sm {
  width: 360px;
}
.modal.md {
  width: 520px;
}
.modal.lg {
  width: 720px;
}

.modal.mobile {
  width: 100%;
  height: 100%;
  border-radius: 0;
}
</style>
