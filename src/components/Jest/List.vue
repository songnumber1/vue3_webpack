<template>
  <ul>
    <li :key="item" v-for="item in items">
      {{ item }}
    </li>
  </ul>
</template>

<script>
export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "list",
  props: ["items"],
};
</script>
