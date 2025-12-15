<template>
  <div class="messages">
    <component
      v-for="(m, i) in messages"
      :key="i"
      :is="resolveComponent(m.role)"
      :message="m"
      :render="render"
    />
  </div>
</template>

<script>
import ChatMessageUser from "./ChatMessageUser.vue";
import ChatMessageAssistant from "./ChatMessageAssistant.vue";

export default {
  name: "ChatMessageList",

  components: {
    ChatMessageUser,
    ChatMessageAssistant,
  },

  props: {
    messages: {
      type: Array,
      required: true,
    },
    render: {
      type: Function,
      required: true,
    },
  },

  methods: {
    resolveComponent(role) {
      return role === "user" ? "ChatMessageUser" : "ChatMessageAssistant";
    },
  },
};
</script>
