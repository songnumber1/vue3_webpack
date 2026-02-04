<template>
  <div class="ms-wrap">
    <select class="ms-select" v-model="selected" :disabled="!models.length">
      <option v-if="!models.length" value="">모델 없음</option>
      <option v-for="m in models" :key="m.model_id" :value="m.model_id">
        {{ m.name_ko || m.name_en }}
      </option>
    </select>

    <span class="ms-icon" aria-hidden="true">
      <AppIcon name="chevron-down" size="sm" muted />
    </span>
  </div>
</template>

<script>
import AppIcon from "@/components/common/AppIcon.vue";

export default {
  name: "ModelSelect",
  components: { AppIcon },
  props: {
    models: { type: Array, default: () => [] },
    currentModelId: { type: String, default: "" },
  },
  emits: ["select", "update:model"],
  computed: {
    // ✅ 부모(store)의 modelId를 select의 value로 강제
    selected: {
      get() {
        return this.currentModelId || "";
      },
      set(v) {
        const modelId = v || null;
        // backwards & forwards compatibility
        this.$emit("select", modelId);
        this.$emit("update:model", modelId);
      },
    },
  },
};
</script>

<style scoped>
.ms {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: linear-gradient(180deg, var(--bg-surface), var(--bg-elevated));
  border-radius: 16px;
  box-shadow: var(--shadow-sm);
}

.ms.disabled {
  opacity: 0.6;
}

.ms-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.2px;
}

.ms-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.ms-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  min-width: 220px;
  height: 40px;
  padding: 0 40px 0 14px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: color-mix(in srgb, var(--bg) 55%, transparent);
  color: var(--text-primary);
  cursor: pointer;
  outline: none;
  transition:
    box-shadow 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}

.ms-select:hover {
  transform: translateY(-1px);
}

.ms-select:focus {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
}

.ms-icon {
  position: absolute;
  right: 12px;
  pointer-events: none;
  opacity: 0.75;
}

@media (max-width: 520px) {
  .ms {
    width: 100%;
    justify-content: space-between;
  }
  .ms-wrap {
    width: 100%;
  }
  .ms-select {
    width: 100%;
    min-width: 0;
  }
}
</style>
