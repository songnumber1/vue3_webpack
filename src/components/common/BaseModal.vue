<template>
  <teleport to="body">
    <div v-if="visible" class="overlay" @click.self="close">
      <div class="modal">
        <header class="header">
          <h3>{{ title }}</h3>
          <button @click="close">✕</button>
        </header>

        <section class="body">
          <slot />
        </section>

        <footer class="footer">
          <button @click="close">취소</button>
          <button class="primary" @click="confirm">
            {{ confirmText }}
          </button>
        </footer>
      </div>
    </div>
  </teleport>
</template>

<script>
export default {
  name: "BaseModal",
  props: {
    visible: Boolean,
    title: String,
    confirmText: String,
  },

  emits: ["close", "confirm"],

  methods: {
    close() {
      this.$emit("close");
    },
    confirm() {
      this.$emit("confirm");
    },
  },
};
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
}
.modal {
  width: 400px;
  background: #fff;
  border-radius: 8px;
}
.header,
.footer {
  padding: 12px;
  display: flex;
  justify-content: space-between;
}
.body {
  padding: 12px;
}
.primary {
  background: #3b82f6;
  color: #fff;
}
</style>
