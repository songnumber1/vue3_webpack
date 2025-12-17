<template>
  <div class="model-select" role="group" aria-label="Model selection">
    <label class="field">
      <span class="label">모델</span>
      <select :value="modelId" @change="onModelChange">
        <option v-for="m in models" :key="m.id" :value="m.id">
          {{ m.label }}
        </option>
      </select>
    </label>
  </div>
</template>

<script>
export default {
  name: "ModelSelect",
  props: {
    models: {
      type: Array,
      default: () => [],
    },
    modelId: {
      type: String,
      default: "",
    },
  },
  emits: ["update:model"],
  methods: {
    onModelChange(e) {
      this.$emit("update:model", e.target.value);
    },
  },
};
</script>

<style scoped>
.model-select{
  display: grid;
  gap: 10px;
  width: 100%;
  max-width: 520px;
}

.field{
  display: grid;
  gap: 8px;
}

.label{
  font-size: 12px;
  color: var(--text-muted);
  text-align: left;
}

select{
  width: 100%;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-primary);
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;
}

select:focus{
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent);
}
</style>
