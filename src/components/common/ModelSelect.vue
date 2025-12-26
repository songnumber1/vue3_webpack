<template>
  <div class="model-select">
    <select
      class="model-select-box"
      v-model="selected"
      :disabled="!models.length"
    >
      <option v-if="!models.length" value="">모델 없음</option>

      <option v-for="m in models" :key="m.model_id" :value="m.model_id">
        {{ m.name_ko || m.name_en }}
      </option>
    </select>
  </div>
</template>

<script>
export default {
  name: "ModelSelect",
  props: {
    models: { type: Array, default: () => [] },
    currentModelId: { type: String, default: "" },
  },
  emits: ["select"],
  computed: {
    // ✅ 부모(store)의 modelId를 select의 value로 강제
    selected: {
      get() {
        return this.currentModelId || "";
      },
      set(v) {
        const modelId = v || null;
        this.$emit("select", modelId);
      },
    },
  },
};
</script>

<style scoped>
.model-select {
  display: inline-flex;
  align-items: center;
}

.model-select-box {
  min-width: 160px;
  padding: 6px 10px;
  font-size: 13px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-primary);
  cursor: pointer;
}

.model-select-box:focus {
  outline: none;
  border-color: var(--accent);
}
</style>
