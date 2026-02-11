<template>
  <div class="msg assistant" :data-chat-msg-id="msgId" data-chat-msg-root="1">
    <div class="msg-card assistant">
      <div class="msg-head">
        <div class="msg-head-left">
          <div class="avatar assistant" aria-hidden="true">AI</div>
          <div class="meta">
            <div class="name">Assistant</div>
          </div>
        </div>
        <div class="msg-head-right">
          <span class="time">{{ formattedTime }}</span>
        </div>
      </div>

      <div class="msg-body">
        <div class="md" v-html="render(text)" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "ChatMessageAssistant",
  props: {
    msgId: { type: String, required: true },
    message: { type: Object, required: true },
    render: { type: Function, required: true },
  },
  computed: {
    text() {
      const m = this.message || {};
      return m.text ?? m.content ?? m.message ?? "";
    },
    formattedTime() {
      const m = this.message || {};
      const raw = m.createdAt ?? m.created_at ?? m.time ?? m.ts ?? m.timestamp ?? m.at;
      const d = raw ? new Date(raw) : new Date();
      if (Number.isNaN(d.getTime())) return "";
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const mi = String(d.getMinutes()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
    },
  },
};
</script>
