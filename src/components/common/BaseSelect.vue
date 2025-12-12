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

      <span class="base-select__arrow"> ▽ </span>
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
    // BaseOption / BaseOptionGroup 에서 inject 해서 사용
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

<style lang="scss" scoped>
.base-select {
  position: relative;
  font-size: var(--control-font-size);
  width: auto;

  &--block {
    width: 100%;
  }

  &--disabled {
    opacity: 0.6;
    pointer-events: none;
  }
}

.base-select__control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  width: 100%;
  min-height: var(--input-height);
  padding: 0 var(--space-4);
  padding-right: calc(var(--space-4)); /* 화살표 & clear 영역 확보 */

  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg);
  color: var(--color-text);
  cursor: pointer;
  transition: border-color 0.12s ease, box-shadow 0.12s ease,
    background-color 0.12s ease;

  &:hover {
    border-color: var(--color-primary);
  }
}

.base-select__value {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}

.base-select__placeholder {
  color: var(--color-text-muted);
}

.base-select__clear {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0;
  margin-right: 0.25rem;
}

.base-select__arrow {
  font-size: 0.75rem;
  opacity: 0.8;
  pointer-events: none;
  margin-left: auto;
  padding-left: var(--space-2);
  padding-right: var(--space-2); /* ▶ 화살표 오른쪽에 여유 */
}

/* 드롭다운 */
.base-select__dropdown {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  z-index: 20;
  min-width: 100%;
  max-height: 16rem;

  background: var(--color-bg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
}

.base-select__search {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.base-select__search-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  font-size: var(--control-font-size);
  background: var(--color-bg);
}

.base-select__options {
  max-height: 14rem;
  overflow-y: auto;
}

/* 간단한 페이드 트랜지션 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
