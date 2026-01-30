<template>
  <div ref="root" class="note-content">
    <div>{{ content }}</div>
    <a v-if="href" :href="href" target="_blank" rel="noreferrer">
      {{ linkText }}
    </a>
  </div>
</template>

<script>
export default {
  name: "LinkNote",
  props: {
    content: String,
    href: String,
    linkText: { type: String, default: "바로가기" },
  },
  mounted() {
    this.$nextTick(() => {
      this.$emit("height", this.$refs.root?.offsetHeight || 0);
    });
  },
};
</script>
