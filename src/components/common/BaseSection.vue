<template>
  <div
    class="base-select"
    :class="{
      'base-select--open': isOpen,
      'base-select--disabled': disabled,
      'base-select--block': block,
    }"
  >
    <!-- 컨트롤 영역 -->
    <div class="base-select__control" @click="toggleDropdown">
      <div class="base-select__value">
        <span v-if="displayLabel">{{ displayLabel }}</span>
        <span v-else class="base-select__placeholder">
          {{ placeholder }}
        </span>
      </div>

      <button
        v-if="clearable && !isEmpty && !disabled"
        class="base-select__clear"
        type="button"
        @click.stop="clearSelection"
      >
        ✕
      </button>

      <span class="base-select__arrow"> ▾ </span>
    </div>

    <!-- 드롭다운 -->
    <transition name="fade">
      <div v-if="isOpen" class="base-select__dropdown">
        <!-- 검색 바 -->
        <div v-if="searchable" class="base-select__search">
          <input
            v-model="searchQuery"
            type="text"
            class="base-select__search-input"
            :placeholder="searchPlaceholder"
            @click.stop
          />
        </div>

        <div class="base-select__options">
          <slot />
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: "BaseSelect",
  provide() {
    return {
      baseSelect: {
        registerOption: this.registerOption,
        unregisterOption: this.unregisterOption,
        isSelected: this.isSelected,
        onOptionClick: this.onOptionClick,
        getSearchQuery: () => this.searchQuery,
      },
    };
  },
  props: {
    modelValue: {
      type: [String, Number, Object],
      default: null,
    },
    placeholder: {
      type: String,
      default: "선택하세요",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    clearable: {
      type: Boolean,
      default: true,
    },
    searchable: {
      type: Boolean,
      default: false,
    },
    searchPlaceholder: {
      type: String,
      default: "검색...",
    },
    block: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue", "change"],
  data() {
    return {
      isOpen: false,
      searchQuery: "",
      options: [], // { value, label }
    };
  },
  computed: {
    isEmpty() {
      return (
        this.modelValue === null ||
        this.modelValue === undefined ||
        this.modelValue === ""
      );
    },
    displayLabel() {
      const match = this.options.find((opt) =>
        this.isSameValue(opt.value, this.modelValue)
      );
      return match ? match.label : "";
    },
  },
  mounted() {
    window.addEventListener("click", this.handleClickOutside);
  },
  beforeUnmount() {
    window.removeEventListener("click", this.handleClickOutside);
  },
  methods: {
    toggleDropdown() {
      if (this.disabled) return;
      this.isOpen = !this.isOpen;
    },
    closeDropdown() {
      this.isOpen = false;
      this.searchQuery = "";
    },
    handleClickOutside(e) {
      if (!this.$el.contains(e.target)) {
        this.closeDropdown();
      }
    },
    clearSelection() {
      this.$emit("update:modelValue", null);
      this.$emit("change", null);
      this.closeDropdown();
    },
    isSameValue(a, b) {
      // 단순 비교 (필요하면 Object 비교로 확장)
      return a === b;
    },
    isSelected(value) {
      return this.isSameValue(value, this.modelValue);
    },
    onOptionClick(value, label) {
      this.$emit("update:modelValue", value);
      this.$emit("change", { value, label });
      this.closeDropdown();
    },
    registerOption(option) {
      // { value, label }
      const exists = this.options.some((o) =>
        this.isSameValue(o.value, option.value)
      );
      if (!exists) {
        this.options.push(option);
      }
    },
    unregisterOption(value) {
      this.options = this.options.filter(
        (opt) => !this.isSameValue(opt.value, value)
      );
    },
  },
};
</script>

<style lang="scss">
@use "@/assets/styles/components/basesection.scss";
</style>
