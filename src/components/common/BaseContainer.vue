<template>
  <div class="base-container">
    <slot />
  </div>
</template>

<script>
export default {
  name: "BaseContainer"
};
</script>

<style lang="scss">
@use "@/assets/styles/components/basecontainer.scss";
</style>
