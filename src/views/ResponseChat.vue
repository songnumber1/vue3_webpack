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
export default {
  name: "ChatPage",
  data() {
    return {
      input: "",
      user: {name: "홍길동"},
      messages: [
        {sender: "홍길동", text: "안녕하세요~"},
        {sender: "김개발", text: "아! 안녕하세요 홍길동님 :)"},
        {sender: "홍길동", text: "오늘 회의는 몇 시에 시작하나요?"},
        {sender: "김개발", text: "오후 2시에 줌으로 진행될 예정이에요."},
        {sender: "홍길동", text: "확인했습니다. 감사합니다!"},
        {sender: "김개발", text: "혹시 어제 보낸 문서 검토해보셨나요?"},
        {
          sender: "홍길동",
          text: "네, 내용 아주 잘 정리돼 있었어요. 몇 가지 수정만 하면 될 것 같아요.",
        },
        {
          sender: "김개발",
          text: "앗 감사합니다! 수정 사항 있으시면 공유 부탁드려요.",
        },
        {
          sender: "홍길동",
          text: "넵, 조금 있다가 메일로 정리해서 보내드릴게요.",
        },
        {sender: "김개발", text: "좋아요! 기다릴게요 :)"},
        {sender: "홍길동", text: "참, 다음주 일정 조정이 필요할 것 같아요."},
        {
          sender: "김개발",
          text: "아 네. 구체적인 일정 알려주시면 조정하겠습니다.",
        },
        {
          sender: "홍길동",
          text: "화요일 오전은 회의가 겹쳐서 수요일 오후는 어떨까요?",
        },
        {
          sender: "김개발",
          text: "수요일 오후 괜찮습니다. 그렇게 변경해두겠습니다.",
        },
        {sender: "홍길동", text: "네 감사합니다!"},
        {sender: "김개발", text: "그럼 이따 회의에서 뵙겠습니다 :)"},
      ],
    };
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
  },
  methods: {
    sendMessage() {
      if (!this.input.trim()) return;
      this.messages.push({sender: this.user.name, text: this.input});
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
