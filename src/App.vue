<!-- src/App.vue -->
<template>
  <router-view />
  <modal-host />
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
