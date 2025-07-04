<template>
  <div class="chat-wrapper">
    <!-- 메시지 출력 영역 -->
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
      <button @click="sendMessage">전송</button>
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
  background: #f5f5f5;
  overflow: hidden;
  font-family: "Segoe UI", sans-serif;
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
  background-color: #f0f0f0;
}

.chat-message.sent .chat-bubble {
  background-color: #1976d2;
  color: white;
  border-bottom-right-radius: 0;
}

.chat-message.received .chat-bubble {
  background-color: #e0e0e0;
  color: black;
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
  background-color: white;
}

.chat-input input {
  flex: 1;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
}

.chat-input button {
  margin-left: 8px;
  padding: 10px 16px;
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
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
