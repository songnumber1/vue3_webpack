<template>
  <BaseModal title="샘플 폼" :onCancel="handleCancel">
    <!-- Body -->
    <div class="form">
      <label>
        이름
        <input v-model="name" />
      </label>

      <label>
        설명
        <textarea v-model="desc" rows="3" />
      </label>
    </div>

    <!-- Footer -->
    <template #footer>
      <button class="btn ghost" @click="handleCancel">취소</button>
      <button class="btn primary" @click="handleConfirm">저장</button>
    </template>
  </BaseModal>
</template>

<script>
import BaseModal from "@/components/common/BaseModal.vue";

export default {
  name: "SampleFormModal",
  components: { BaseModal },

  props: {
    onConfirm: Function,
    onCancel: Function,
  },

  data() {
    return {
      name: "",
      desc: "",
    };
  },

  methods: {
    handleConfirm() {
      this.onConfirm?.({
        name: this.name,
        desc: this.desc,
      });
    },
    handleCancel() {
      this.onCancel?.();
    },
  },
};
</script>

<style scoped>
.form {
  display: grid;
  gap: 12px;
}
label {
  display: flex;
  flex-direction: column;
  font-size: 13px;
}
input,
textarea {
  margin-top: 4px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--border);
}
</style>
