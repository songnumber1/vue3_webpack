<!-- src/App.vue -->
<template>
  <router-view />
  <ModalHost />
</template>

<script>
import ModalHost from "@/components/common/ModalHost.vue";
export default {
  name: "App",
  components: {
    ModalHost,
  },
};
</script>
