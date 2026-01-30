<template>
  <div ref="root" class="note-content">
    <progress :value="percent" max="100"></progress>
    <div>{{ percent }}%</div>
  </div>
</template>

<script>
export default {
  name: "ProgressNote",
  props: {
    percent: { type: Number, required: true },
  },
  mounted() {
    this.$nextTick(() => {
      this.$emit("height", this.$refs.root?.offsetHeight || 0);
    });
  },
};
</script>
