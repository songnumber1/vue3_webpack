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
