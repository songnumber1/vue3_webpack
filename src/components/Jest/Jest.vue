<template>
  <div style="background-color: red">
    <p ref="tgmp"></p>
  </div>
</template>

<script>
export default {
  name: "HelloWorld",
  props: {
    msg: String,
  },
  mounted() {
    this.voidRefsFunc();
  },
  methods: {
    voidRefsFunc() {
      this.$refs.tgmp.innerText = "1234";
    },
    returnIntRefsFunc(data) {
      this.$refs.tgmp.innerText = "1234";
      return data;
    },
    returnIntFunc(data) {
      return data;
    },
  },
};
</script>
