<template>
  <div>
    <BaseModal
      v-for="(m, i) in state.stack"
      :key="m.id"
      :size="m.options?.size || 'md'"
      :title="m.options?.title || 'Modal'"
      :draggable="isTop(i) && m.options?.draggable !== false"
      :resizable="isTop(i) && m.options?.resizable !== false"
      :style="{ zIndex: 10000 + i }"
      @close="onCancel(i)"
    >
      <component :is="m.component" ref="bodies" v-bind="m.props" />

      <template #footer>
        <button @click="onCancel(i)">Cancel</button>
        <button class="primary" @click="onConfirm(i)">Confirm</button>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import BaseModal from "@/components/common/BaseModal.vue";
import { useModalManager } from "@/plugins/modalManager";

export default {
  name: "ModalHost",
  components: { BaseModal },

  data() {
    return {
      modal: useModalManager(),
    };
  },

  computed: {
    state() {
      return this.modal.state;
    },
  },

  methods: {
    isTop(index) {
      return index === this.state.stack.length - 1;
    },

    onCancel(index) {
      if (this.isTop(index)) {
        this.modal.closeModal(null);
      }
    },

    onConfirm(index) {
      if (!this.isTop(index)) return;

      const body = this.$refs.bodies?.[index];
      const validate = body?.validate ? body.validate() : true;

      if (!validate) {
        return;
      }

      let payload = null;

      if (body?.getPayload) {
        payload = body.getPayload();
      }

      this.modal.closeModal(payload);
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
