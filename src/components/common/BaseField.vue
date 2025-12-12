<template>
  <div class="base-field">
    <BaseLabel v-if="label">
      {{ label }}
      <span v-if="required" class="base-field__required">*</span>
    </BaseLabel>

    <component
      :is="component"
      v-bind="$attrs"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event)"
      :error="error"
      :block="block"
    />

    <p v-if="errorMessage" class="base-field__error">
      {{ errorMessage }}
    </p>
  </div>
</template>

<script>
import BaseLabel from "./BaseLabel.vue";

export default {
  name: "BaseField",
  components: { BaseLabel },
  inheritAttrs: false,
  props: {
    label: {
      type: String,
      default: ""
    },
    modelValue: {
      type: [String, Number],
      default: ""
    },
    component: {
      type: String,
      default: "BaseInput"
    },
    error: {
      type: Boolean,
      default: false
    },
    errorMessage: {
      type: String,
      default: ""
    },
    block: {
      type: Boolean,
      default: true
    },
    required: {
      type: Boolean,
      default: false
    }
  },
  emits: ["update:modelValue"]
};
</script>

<style lang="scss" scoped>
.base-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.base-field__required {
  color: #ef4444;
  margin-left: 2px;
  font-size: var(--font-size-xs);
}

.base-field__error {
  font-size: var(--font-size-xs);
  color: #ef4444;
  margin: 0;
}
</style>
