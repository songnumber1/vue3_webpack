<template>
  <div class="msg user" :data-chat-msg-id="msgId" data-chat-msg-root="1">
    <div class="msg-card">
      <div class="msg-head">
        <div class="msg-head-left">
          <div class="avatar user" aria-hidden="true">{{ avatarText }}</div>
          <div class="meta">
            <div class="name">{{ displayName }}</div>
          </div>
        </div>
        <div class="msg-head-right">
          <span class="time">{{ formattedTime }}</span>
        </div>
      </div>

      <div class="msg-body">
        <div class="md" v-html="render(text)" />
      </div>

      <ChatAttachmentTray
        v-if="attachments.length"
        class="msg-attachments"
        :items="attachments"
        :readonly="true"
      />
    </div>
  </div>
</template>

<script>
import ChatAttachmentTray from "./ChatAttachmentTray.vue";

export default {
  name: "ChatMessageUser",
  components: { ChatAttachmentTray },
  props: {
    msgId: { type: String, required: true },
    message: { type: Object, required: true },
    render: { type: Function, required: true },
  },
  computed: {
    displayName() {
      // Keep neutral (avoid coupling to auth store)
      return "You";
    },
    avatarText() {
      // Initials from displayName
      const n = String(this.displayName || "").trim();
      if (!n) return "?";
      const parts = n.split(/\s+/).filter(Boolean);
      const first = parts[0]?.[0] || n[0];
      const second = parts.length > 1 ? parts[1]?.[0] : "";
      return (first + second).toUpperCase();
    },
    text() {
      const m = this.message || {};
      return m.text ?? m.content ?? m.message ?? "";
    },
    attachments() {
      const m = this.message || {};
      return Array.isArray(m.attachments) ? m.attachments : [];
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
