<template>
  <div class="msg user">
    <div class="bubble" v-html="render(text)" />
    <ChatAttachmentTray
      v-if="attachments.length"
      :items="attachments"
      :readonly="true"
    />
  </div>
</template>

<script>
import ChatAttachmentTray from "./ChatAttachmentTray.vue";

export default {
  name: "ChatMessageUser",

  components: { ChatAttachmentTray },

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

    attachments() {
      const m = this.message || {};
      return Array.isArray(m.attachments) ? m.attachments : [];
    },
  },
};
</script>
