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
import { md } from "@/utils/markdown";

export default {
  name: "ChatMessageList",

  components: {
    ChatMessageUser,
    ChatMessageAssistant,
  },

  computed: {
    messages() {
      return this.$store.getters["chat/activeMessages"];
    },
  },

  methods: {
    render(text) {
      return md.render(String(text ?? ""));
    },
    resolveComponent(role) {
      return role === "user" ? "ChatMessageUser" : "ChatMessageAssistant";
    },
  },
};
</script>
