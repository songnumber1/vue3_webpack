<template>
  <div style="background-color: red">
    <p id="first" ref="firstRef">1234</p>
    <p class="second" ref="secondRef">4321</p>
  </div>
</template>
<script>
export default {
  name: "MountedTest",
  mounted() {
    this.$refs.firstRef.innerText = "1234";
    this.$refs.secondRef.innerText = "4321";
  },
  methods: {},
};
</script>
