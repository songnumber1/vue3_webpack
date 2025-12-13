<template>
  <footer class="app-footer">
    <BaseContainer class="app-footer__inner">
      <span>© {{ year }} DS Assistant UI · Vue 3 · Responsive + Theme</span>
    </BaseContainer>
  </footer>
</template>

<script>
import BaseContainer from "@/components/common/BaseContainer.vue";

export default {
  name: "AppFooter",
  components: { BaseContainer },
  data() {
    return {
      year: new Date().getFullYear(),
    };
  },
};
</script>

<style lang="scss">
@use "@/assets/styles/layout/appfooter.scss";
</style>
