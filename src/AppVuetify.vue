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
}

#app {
  height: 100%;
}

.v-application {
  height: 100%;
}
</style>
