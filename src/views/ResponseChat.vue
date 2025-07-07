<template>
  <div class="chat-wrapper">
    <div class="chat-body" ref="chatBody">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        :class="[
          'chat-message',
          msg.sender === user.name ? 'sent' : 'received',
        ]"
      >
        <div class="chat-bubble">
          <span class="sender">{{ msg.sender }}</span>
          {{ msg.text }}
        </div>
      </div>
    </div>

    <div class="chat-input">
      <input
        v-model="input"
        type="text"
        placeholder="메시지를 입력하세요..."
        @keyup.enter="sendMessage"
      />
      <button class="send-button" @click="sendMessage">전송</button>
    </div>
  </div>
</template>

<script>
import {mapState, mapMutations} from "vuex";

export default {
  name: "ChatPage",
  data() {
    return {
      input: "",
      user: {name: "홍길동"},
    };
  },
  computed: {
    ...mapState(["messages"]),
  },
  mounted() {
    window.addEventListener("message", (event) => {
      if (event.data?.type === "theme-change") {
        const root = document.documentElement;
        const themeVars = event.data.payload;
        Object.entries(themeVars).forEach(([key, value]) => {
          root.style.setProperty(key, value);
        });
      }
    });
    this.$nextTick(() => {
      this.$refs.chatBody.scrollTop = this.$refs.chatBody.scrollHeight;
    });
  },
  methods: {
    ...mapMutations(["addMessage"]),
    sendMessage() {
      if (!this.input.trim()) return;
      const msg = {sender: this.user.name, text: this.input};
      this.addMessage(msg);
      this.input = "";
      this.$nextTick(() => {
        this.$refs.chatBody.scrollTop = this.$refs.chatBody.scrollHeight;
      });
    },
  },
};
</script>

<style>
.chat-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--background-color);
  color: var(--text-color);
}

.chat-body {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.chat-message {
  display: flex;
  margin-bottom: 10px;
}
.chat-message.sent {
  justify-content: flex-end;
}
.chat-message.received {
  justify-content: flex-start;
}
.chat-bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 16px;
  background-color: var(--bubble-bg-received);
}
.chat-message.sent .chat-bubble {
  background-color: var(--bubble-bg-sent);
  color: white;
  border-bottom-right-radius: 0;
}
.chat-message.received .chat-bubble {
  color: var(--text-color);
  border-bottom-left-radius: 0;
}

.chat-input {
  display: flex;
  padding: 12px;
  border-top: 1px solid #ccc;
  background-color: var(--input-bg);
}
.chat-input input {
  flex: 1;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
}
.send-button {
  margin-left: 8px;
  padding: 10px 16px;
  background-color: var(--send-button-color);
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
}
</style>
