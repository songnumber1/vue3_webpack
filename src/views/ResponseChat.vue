<template>
  <div class="chat-wrapper">
    <!-- 메시지 출력 -->
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

    <!-- 입력창 -->
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
export default {
  name: "ChatPage",
  data() {
    return {
      input: "",
      user: {
        name: "홍길동",
      },
      messages: [
        {sender: "홍길동", text: "안녕하세요~"},
        {sender: "김개발", text: "아! 안녕하세요 홍길동님 :)"},
        {sender: "홍길동", text: "오늘 회의는 몇 시에 시작하나요?"},
        {sender: "김개발", text: "오후 2시에 줌으로 진행될 예정이에요."},
        {sender: "홍길동", text: "확인했습니다. 감사합니다!"},
      ],
    };
  },
  mounted() {
    window.addEventListener("message", (event) => {
      if (event.data?.type === "theme-change") {
        const theme = event.data.theme;
        const root = document.documentElement;

        if (theme === "dark") {
          root.style.setProperty("--background-color", "#1e1e1e");
          root.style.setProperty("--input-bg", "#2c2c2c");
          root.style.setProperty("--send-button-color", "#444");
          root.style.setProperty("--bubble-bg-sent", "#555");
          root.style.setProperty("--bubble-bg-received", "#444");
          root.style.setProperty("--text-color", "#eee");
        } else {
          root.style.setProperty("--background-color", "#f5f5f5");
          root.style.setProperty("--input-bg", "white");
          root.style.setProperty("--send-button-color", "#1976d2");
          root.style.setProperty("--bubble-bg-sent", "#1976d2");
          root.style.setProperty("--bubble-bg-received", "#e0e0e0");
          root.style.setProperty("--text-color", "#000");
        }
      }
    });
  },
  methods: {
    sendMessage() {
      if (!this.input.trim()) return;
      this.messages.push({
        sender: this.user.name,
        text: this.input.trim(),
      });
      this.input = "";
      this.$nextTick(() => {
        const el = this.$refs.chatBody;
        el.scrollTop = el.scrollHeight;
      });
    },
  },
};
</script>

<style scoped>
.chat-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--background-color, #f5f5f5);
  overflow: hidden;
  font-family: "Segoe UI", sans-serif;
  color: var(--text-color, #000);
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
  font-size: 14px;
  line-height: 1.4;
  background-color: var(--bubble-bg-received, #e0e0e0);
  color: inherit;
}
.chat-message.sent .chat-bubble {
  background-color: var(--bubble-bg-sent, #1976d2);
  color: white;
  border-bottom-right-radius: 0;
}
.chat-message.received .chat-bubble {
  background-color: var(--bubble-bg-received, #e0e0e0);
  color: inherit;
  border-bottom-left-radius: 0;
}

.sender {
  font-size: 0.75rem;
  font-weight: bold;
  margin-bottom: 4px;
  display: block;
}

.chat-input {
  display: flex;
  padding: 12px;
  border-top: 1px solid #ccc;
  background-color: var(--input-bg, white);
}
.chat-input input {
  flex: 1;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
  background-color: var(--input-bg, white);
  color: var(--text-color, #000);
}
.send-button {
  margin-left: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: bold;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: white;
  background-color: var(--send-button-color, #1976d2);
}
@media (max-width: 600px) {
  .chat-bubble {
    max-width: 85%;
  }
  .chat-input button {
    padding: 10px 12px;
  }
}
</style>
