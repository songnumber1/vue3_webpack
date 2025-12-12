<template>
  <transition name="toast-fade">
    <div
      v-if="show"
      class="base-toast"
      :class="`base-toast--${type}`"
      role="status"
    >
      <slot>{{ message }}</slot>
    </div>
  </transition>
</template>

<script>
export default {
  name: "BaseToast",
  props: {
    show: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: ""
    },
    type: {
      type: String,
      default: "info" // info | success | error | warning
    }
  }
};
</script>

<style lang="scss" scoped>
.base-toast {
  position: fixed;
  right: var(--space-4);
  top: var(--space-4);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: #ffffff;
  box-shadow: var(--shadow-soft);
  z-index: 60;
}

.base-toast--info {
  background: #3b82f6;
}
.base-toast--success {
  background: #16a34a;
}
.base-toast--error {
  background: #ef4444;
}
.base-toast--warning {
  background: #f59e0b;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
