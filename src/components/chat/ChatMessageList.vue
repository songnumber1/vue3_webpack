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
import { useChatStore } from "@/stores/chatStore";

export default {
  name: "ChatMessageList",

  components: {
    ChatMessageUser,
    ChatMessageAssistant,
  },

  computed: {
    store() {
      return useChatStore();
    },

    messages() {
      return this.store.messages;
    },
  },

  created() {
    // ✅ standalone-safe (works even when AppLayout is not mounted)
    this.store.ensureInitialized();
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
