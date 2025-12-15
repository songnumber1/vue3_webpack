<template>
  <div class="msg assistant">
    <div class="bubble" v-html="render(message.text)" />
  </div>
</template>

<script>
export default {
  name: "ChatMessageAssistant",

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
