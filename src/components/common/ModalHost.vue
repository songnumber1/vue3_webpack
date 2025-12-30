<template>
  <BaseModal
    v-if="state.visible"
    :size="state.options.size"
    :draggable="state.options.draggable"
    :resizable="state.options.resizable"
    :title="state.options.title"
    @close="onCancel"
  >
    <!-- Body -->
    <component :is="state.component" ref="bodyRef" v-bind="state.props" />

    <!-- Footer -->
    <template #footer>
      <button @click="onCancel">Cancel</button>
      <button class="primary" @click="onConfirm">Confirm</button>
    </template>
  </BaseModal>
</template>

<script>
import BaseModal from "@/components/common/BaseModal.vue";
import { useModalManager } from "@/plugins/modalManager";

export default {
  name: "ModalHost",
  components: { BaseModal },

  data() {
    return {
      state: useModalManager().state,
    };
  },

  methods: {
    onCancel() {
      this.state.props?.onCancel?.();
    },

    async onConfirm() {
      await this.$nextTick();

      let result;
      if (this.$refs.bodyRef?.getValue) {
        result = this.$refs.bodyRef.getValue();
      }

      this.state.props?.onConfirm?.(result);
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
