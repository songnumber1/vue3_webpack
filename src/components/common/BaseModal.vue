<template>
  <transition name="modal-fade">
    <div
      v-if="visible"
      class="base-modal__backdrop"
      @click.self="handleBackdrop"
    >
      <section class="base-modal" role="dialog" aria-modal="true">
        <header class="base-modal__header">
          <slot name="title">
            <h2 class="base-modal__title">{{ title }}</h2>
          </slot>
          <button type="button" class="base-modal__close" @click="close">
            ✕
          </button>
        </header>

        <div class="base-modal__body">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="base-modal__footer">
          <slot name="footer" />
        </footer>
      </section>
    </div>
  </transition>
</template>

<script>
export default {
  name: "BaseModal",
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ""
    },
    closeOnBackdrop: {
      type: Boolean,
      default: true
    }
  },
  emits: ["update:visible", "close"],
  methods: {
    close() {
      this.$emit("update:visible", false);
      this.$emit("close");
    },
    handleBackdrop() {
      if (this.closeOnBackdrop) {
        this.close();
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.base-modal__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.base-modal {
  width: 100%;
  max-width: 480px;
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft);
  padding: var(--space-3) var(--space-3) var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.base-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.base-modal__title {
  margin: 0;
  font-size: var(--font-size-md);
}

.base-modal__close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: var(--font-size-md);
  color: var(--color-text-muted);
}

.base-modal__body {
  font-size: var(--font-size-sm);
  color: var(--color-text);
}

.base-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.18s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
