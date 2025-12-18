<template>
  <BaseModal
    v-if="manager.open"
    :visible="manager.open"
    :title="current.title"
    :confirmText="current.confirmText"
    @close="close"
    @confirm="confirm"
  >
    <component
      :is="current.component"
      v-bind="manager.props"
      @submit="submit"
    />
  </BaseModal>
</template>

<script>
import BaseModal from "./BaseModal.vue";
import { modalManager } from "@/plugins/modalManager";
import SampleFormModal from "@/components/modals/SampleFormModal.vue";

export default {
  name: "ModalHost",

  components: {
    BaseModal,
    SampleFormModal,
  },

  data() {
    return {
      manager: modalManager,
    };
  },

  computed: {
    current() {
      return this.manager.modalMap[this.manager.type] || {};
    },
  },

  methods: {
    close() {
      this.manager.close();
    },
    confirm() {
      this.manager.confirm();
    },
    submit(data) {
      this.manager.confirm(data);
    },
  },
};
</script>
