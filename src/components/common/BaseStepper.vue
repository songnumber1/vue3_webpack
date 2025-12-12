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

<style lang="scss">
@use "@/assets/styles/components/basestepper.scss";
</style>
