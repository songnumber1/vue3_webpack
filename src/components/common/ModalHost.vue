<template>
  <BaseModal
    v-if="state.visible"
    :visible="state.visible"
    :size="state.size"
    v-bind="state.props"
  >
    <component :is="state.component" v-bind="state.props" />
  </BaseModal>
</template>

<script>
import { useModalManager } from "@/plugins/modalManager";
import BaseModal from "@/components/common/BaseModal.vue";

export default {
  name: "ModalHost",
  components: {
    BaseModal,
  },

  setup() {
    const { state } = useModalManager();
    console.log("ModalHost mounted, visible:", state.visible);
    return { state };
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
