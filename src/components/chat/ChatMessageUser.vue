<template>
  <div class="msg user">
    <div class="bubble" v-html="render(text)" />
  </div>
</template>

<script>
export default {
  name: "ChatMessageUser",

  props: {
    message: {
      type: Object,
      required: true,
    },
    render: {
      type: Function,
      required: true,
    },
  },

  computed: {
    // ✅ tolerate multiple legacy field names
    text() {
      const m = this.message || {};
      return m.text ?? m.content ?? m.message ?? "";
    },
  },
};
</script>
