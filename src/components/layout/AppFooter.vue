<template>
  <footer class="app-footer">
    <div class="app-footer__inner">
      <span>© {{ year }} DS Assistant UI · Vue 3 · Responsive + Theme</span>
    </div>
  </footer>
</template>

<script>
export default {
  name: "AppFooter",
  data() {
    return {
      year: new Date().getFullYear()
    };
  }
};
</script>

<style lang="scss">
@use "@/assets/styles/components/appfooter.scss";
</style>
