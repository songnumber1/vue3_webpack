<template>
  <div class="base-modal">
    <!-- Header -->
    <header v-if="$slots.header || title" class="bm-header">
      <slot name="header">
        <strong class="bm-title">{{ title }}</strong>
      </slot>

      <button
        v-if="closable"
        class="bm-close"
        type="button"
        aria-label="close"
        @click="emitCancel"
      >
        ✕
      </button>
    </header>

    <!-- Body -->
    <section class="bm-body">
      <slot />
    </section>

    <!-- Footer -->
    <footer v-if="$slots.footer" class="bm-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script>
export default {
  name: "BaseModal",

  props: {
    title: String,
    closable: {
      type: Boolean,
      default: true,
    },
    onCancel: Function,
  },

  methods: {
    emitCancel() {
      this.onCancel?.();
    },
  },
};
</script>

<style scoped>
.base-modal {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Header */
.bm-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}
.bm-title {
  font-size: 15px;
  font-weight: 800;
}
.bm-close {
  margin-left: auto;
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}

/* Body */
.bm-body {
  padding: 16px;
  flex: 1;
  overflow: auto;
}

/* Footer */
.bm-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
