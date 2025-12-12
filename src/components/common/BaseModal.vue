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

<style lang="scss">
@use "@/assets/styles/components/basemodal.scss";
</style>
