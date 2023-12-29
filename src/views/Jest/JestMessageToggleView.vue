<template>
  <MessageToggle />
</template>

<script>
import {defineComponent} from "vue";

// Components
import MessageToggle from "@/components/Jest/MessageToggle.vue";

export default defineComponent({
  name: "JestMessageToggleView",

  components: {
    MessageToggle,
  },
});
</script>
