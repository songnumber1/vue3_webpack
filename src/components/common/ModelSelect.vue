<template>
  <div class="model-select" role="group" aria-label="Model selection">
    <label class="field">
      <span class="label">모델 그룹</span>
      <select :value="groupId" @change="onGroupChange">
        <option v-for="g in groups" :key="g.id" :value="g.id">
          {{ g.label }}
        </option>
      </select>
    </label>

    <label class="field">
      <span class="label">모델</span>
      <select :value="modelId" @change="onModelChange">
        <option v-for="m in currentModels" :key="m.id" :value="m.id">
          {{ m.label }}
        </option>
      </select>
    </label>
  </div>
</template>

<script>
import { getDefaultModelId } from "@/constants/models";

export default {
  name: "ModelSelect",
  props: {
    groups: { type: Array, default: () => [] },
    groupId: { type: String, default: "" },
    modelId: { type: String, default: "" },
  },
  emits: ["update:group", "update:model"],
  computed: {
    currentGroup() {
      return (
        this.groups.find((g) => g.id === this.groupId) || this.groups[0] || null
      );
    },
    currentModels() {
      return this.currentGroup?.models || [];
    },
  },
  methods: {
    onGroupChange(e) {
      const nextGroupId = e?.target?.value || "";
      this.$emit("update:group", nextGroupId);
      // group을 바꾸면 model은 해당 group의 첫 모델로 보정
      this.$emit("update:model", getDefaultModelId(nextGroupId));
    },
    onModelChange(e) {
      const nextModelId = e?.target?.value || "";
      this.$emit("update:model", nextModelId);
    },
  },
};
</script>

<style scoped>
.model-select {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin: 10px auto 0;
}

.field {
  display: grid;
  gap: 6px;
  min-width: 180px;
}

.label {
  font-size: 12px;
  color: var(--text-muted);
  text-align: left;
}

select {
  width: 100%;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-primary);
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;
}

@media (max-width: 700px) {
  .field {
    min-width: 160px;
  }
}
</style>
