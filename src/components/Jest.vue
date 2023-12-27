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
    this.divHeightChange();
  },
  methods: {
    divHeightChange() {
      this.$refs.tgmp.innerText = "1234";
    },
    divHeightChange1(data) {
      this.$refs.tgmp.innerText = "1234";
      return data;
    },
  },
};
</script>
