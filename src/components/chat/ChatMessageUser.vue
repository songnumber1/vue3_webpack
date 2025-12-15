<template>
  <div class="msg user">
    <div class="bubble" v-html="render(message.text)" />
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
};
</script>
