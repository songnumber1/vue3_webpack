<template>
  <List />
</template>

<script>
import {defineComponent} from "vue";

// Components
import List from "@/components/Jest/List.vue";

export default defineComponent({
  name: "JestView",

  components: {
    List,
  },
});
</script>
