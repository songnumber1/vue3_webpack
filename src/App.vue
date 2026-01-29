<!-- src/App.vue -->
<template>
  <router-view />
  <ModalHost />
  <NoteHost />
</template>

<script>
import ModalHost from "@/components/common/ModalHost.vue";
import NoteHost from "@/components/common/NoteHost.vue";
export default {
  name: "App",
  components: {
    ModalHost,
    NoteHost,
  },
};
</script>
