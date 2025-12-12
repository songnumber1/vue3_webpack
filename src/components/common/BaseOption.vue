<template>
  <div
    v-if="isVisible"
    class="base-option"
    :class="{
      'base-option--selected': isSelected,
      'base-option--disabled': disabled
    }"
    @click="handleClick"
  >
    <slot>{{ label }}</slot>
  </div>
</template>

<script>
import { inject } from "vue";

export default {
  name: "BaseOption",
  props: {
    value: {
      type: [String, Number, Object],
      required: true
    },
    label: {
      type: String,
      default: ""
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  inject: {
    baseSelect: {
      default: null
    }
  },
  data() {
    return {
      selfLabel: ""
    };
  },
  computed: {
    effectiveLabel() {
      // label prop 우선, 없으면 slot 텍스트
      return this.label || this.selfLabel || "";
    },
    isSelected() {
      if (!this.baseSelect || !this.baseSelect.isSelected) return false;
      return this.baseSelect.isSelected(this.value);
    },
    isVisible() {
      if (!this.baseSelect || !this.baseSelect.getSearchQuery) return true;
      const q = (this.baseSelect.getSearchQuery() || "").toLowerCase();
      if (!q) return true;
      return this.effectiveLabel.toLowerCase().includes(q);
    }
  },
  mounted() {
    // slot 텍스트를 label로 사용할 수 있도록 시도
    if (!this.label && this.$slots.default) {
      const vnodes = this.$slots.default();
      const text = vnodes.map((v) => v.children || "").join("").trim();
      this.selfLabel = text;
    }
    if (this.baseSelect && this.baseSelect.registerOption) {
      this.baseSelect.registerOption({
        value: this.value,
        label: this.effectiveLabel
      });
    }
  },
  beforeUnmount() {
    if (this.baseSelect && this.baseSelect.unregisterOption) {
      this.baseSelect.unregisterOption(this.value);
    }
  },
  methods: {
    handleClick() {
      if (this.disabled) return;
      if (!this.baseSelect || !this.baseSelect.onOptionClick) return;
      this.baseSelect.onOptionClick(this.value, this.effectiveLabel);
    }
  }
};
</script>

<style lang="scss" scoped>
.base-option {
  padding: var(--space-2) var(--space-3);
  font-size: var(--control-font-size);
  color: var(--color-text);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background-color 0.12s ease, color 0.12s ease;
}

.base-option:hover {
  background: var(--color-primary-soft);
}

.base-option--selected {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.base-option--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>