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

<style lang="scss">
@use "@/assets/styles/components/baseaccordion.scss";
</style>
