<template>
  <div class="base-accordion">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="base-accordion__item"
    >
      <button
        class="base-accordion__header"
        type="button"
        @click="toggle(index)"
      >
        <span>{{ item.title }}</span>
        <span class="base-accordion__icon">
          {{ isOpen(index) ? "▾" : "▸" }}
        </span>
      </button>
      <transition name="accordion">
        <div v-if="isOpen(index)" class="base-accordion__body">
          <slot :name="item.slot || index" :item="item">
            <p class="base-accordion__text">
              {{ item.content }}
            </p>
          </slot>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  name: "BaseAccordion",
  props: {
    items: {
      type: Array,
      default: () => []
    },
    multiple: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      openIndexes: []
    };
  },
  methods: {
    isOpen(i) {
      return this.openIndexes.includes(i);
    },
    toggle(i) {
      if (this.multiple) {
        if (this.isOpen(i)) {
          this.openIndexes = this.openIndexes.filter((x) => x !== i);
        } else {
          this.openIndexes = [...this.openIndexes, i];
        }
      } else {
        this.openIndexes = this.isOpen(i) ? [] : [i];
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.base-accordion {
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.base-accordion__item + .base-accordion__item {
  border-top: 1px solid var(--color-border);
}

.base-accordion__header {
  width: 100%;
  text-align: left;
  padding: var(--space-2) var(--space-3);
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.base-accordion__body {
  padding: 0 var(--space-3) var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.base-accordion__icon {
  font-size: var(--font-size-xs);
}

.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.16s ease;
}
.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
