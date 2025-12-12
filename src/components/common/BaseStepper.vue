<template>
  <div class="base-stepper">
    <div class="base-stepper__track">
      <div
        v-for="(step, index) in steps"
        :key="index"
        class="base-stepper__step"
        :class="{
          'base-stepper__step--active': index === currentIndex,
          'base-stepper__step--done': index < currentIndex
        }"
        @click="goTo(index)"
      >
        <div class="base-stepper__circle">
          <span v-if="index < currentIndex">✓</span>
          <span v-else>{{ index + 1 }}</span>
        </div>
        <div class="base-stepper__label">
          <div class="base-stepper__title">{{ step.label }}</div>
          <div v-if="step.description" class="base-stepper__desc">
            {{ step.description }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "BaseStepper",
  props: {
    steps: {
      type: Array,
      default: () => []
    },
    modelValue: {
      type: Number,
      default: 0
    }
  },
  emits: ["update:modelValue"],
  computed: {
    currentIndex() {
      if (!this.steps.length) return 0;
      return Math.min(Math.max(this.modelValue, 0), this.steps.length - 1);
    }
  },
  methods: {
    goTo(i) {
      this.$emit("update:modelValue", i);
    }
  }
};
</script>

<style lang="scss" scoped>
.base-stepper {
  width: 100%;
}

.base-stepper__track {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.base-stepper__step {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  cursor: pointer;
}

.base-stepper__circle {
  width: 26px;
  height: 26px;
  border-radius: 999px;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.base-stepper__label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.base-stepper__title {
  font-size: var(--font-size-sm);
}

.base-stepper__desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.base-stepper__step--active .base-stepper__circle {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.base-stepper__step--done .base-stepper__circle {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: #ffffff;
}
</style>
