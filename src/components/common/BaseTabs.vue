<template>
  <div class="base-tabs">
    <div class="base-tabs__list" role="tablist">
      <button
        v-for="(tab, index) in tabs"
        :key="tab.key || index"
        class="base-tabs__tab"
        :class="{ 'base-tabs__tab--active': currentKey === (tab.key || index) }"
        type="button"
        role="tab"
        @click="select(tab.key ?? index)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="base-tabs__panel" role="tabpanel">
      <slot :name="currentSlotName" />
    </div>
  </div>
</template>

<script>
export default {
  name: "BaseTabs",
  props: {
    tabs: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: [String, Number],
      default: null
    }
  },
  emits: ["update:modelValue"],
  computed: {
    currentKey() {
      if (this.modelValue != null) return this.modelValue;
      return this.tabs[0] ? this.tabs[0].key ?? 0 : 0;
    },
    currentSlotName() {
      const found = this.tabs.find(
        (t, idx) => (t.key ?? idx) === this.currentKey
      );
      return found ? found.slot || found.key || this.tabs.indexOf(found) : 0;
    }
  },
  methods: {
    select(k) {
      this.$emit("update:modelValue", k);
    }
  }
};
</script>

<style lang="scss" scoped>
.base-tabs {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.base-tabs__list {
  display: inline-flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  padding: 2px;
  border-radius: 999px;
  background: var(--color-bg-soft);
}

.base-tabs__tab {
  border: none;
  background: transparent;
  padding: var(--space-1) var(--space-3);
  border-radius: 999px;
  font-size: var(--font-size-xs);
  cursor: pointer;
  color: var(--color-text-muted);
}

.base-tabs__tab--active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-subtle);
}

.base-tabs__panel {
  padding-top: var(--space-1);
}
</style>
