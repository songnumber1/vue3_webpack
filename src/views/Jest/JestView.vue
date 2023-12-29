<template>
  <Jest />
</template>

<script>
import {defineComponent} from "vue";

// Components
import Jest from "@/components/Jest/Jest.vue";

export default defineComponent({
  name: "JestView",

  components: {
    Jest,
  },
});
</script>
