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

<style lang="scss">
@use "@/assets/styles/components/basetoast.scss";
</style>
