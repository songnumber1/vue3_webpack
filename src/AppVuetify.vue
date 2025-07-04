<template>
  <div>
    <router-view />
  </div>
</template>

<script>
export default {
  name: "App",
  data: () => ({
    drawer: false,
    settingDialog: false,
    icons: ["mdi-facebook", "mdi-twitter", "mdi-linkedin", "mdi-instagram"],
  }),
};
</script>

<style>
html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden; /* ✅ 핵심 */
}

#app {
  height: 100%;
  overflow: hidden; /* ✅ 이것도 중요 */
}

.v-application {
  height: 100%;
  overflow: hidden;
}
</style>
