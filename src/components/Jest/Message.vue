<template>
  <div>
    <h1>{{ msg || "default message" }}</h1>
  </div>
</template>

<script>
export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "message",
  props: ["msg"],
  methods: {
    /* istanbul ignore next */
    ignoreFunctionTest() {},

    noticeFunctionTest() {},
  },
};
</script>
