<template>
  <div
    class="base-select"
    :class="{
      'base-select--block': block,
      'base-select--disabled': disabled,
    }"
  >
    <select
      class="base-select__control"
      :value="modelValue"
      :disabled="disabled"
      @change="onChange"
    >
      <option v-if="placeholder" disabled value="">
        {{ placeholder }}
      </option>

      <!-- ✅ optgroup 없음 -->
      <slot />
    </select>
  </div>
</template>

<script>
export default {
  name: "BaseSelect",
  props: {
    modelValue: {
      type: [String, Number],
      default: "",
    },
    placeholder: {
      type: String,
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    block: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "change"],
  methods: {
    onChange(e) {
      const value = e.target.value;
      this.$emit("update:modelValue", value);
      this.$emit("change", value);
    },
  },
};
</script>

<style lang="scss">
@use "@/assets/styles/components/baseselect.scss";
</style>
