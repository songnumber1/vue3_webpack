<template>
  <v-app>
    <v-main>
      <v-container fluid class="chat-wrapper">
        <div class="chat-body">
          <div
            v-for="(msg, i) in messages"
            :key="i"
            :class="[
              'chat-message',
              msg.sender === user.name ? 'sent' : 'received',
            ]"
          >
            <div class="chat-bubble">
              <strong class="sender">{{ msg.sender }}</strong>
              <div>{{ msg.text }}</div>
            </div>
          </div>
        </div>

        <div class="chat-input-bar sticky-footer">
          <v-text-field
            v-model="input"
            placeholder="메시지를 입력하세요..."
            hide-details
            density="comfortable"
            class="flex-grow-1"
            @keyup.enter="sendMessage"
            outlined
          />
          <v-btn color="primary" @click="sendMessage" class="ml-2 text-white"
            >전송</v-btn
          >
        </div>
      </v-container>
    </v-main>
  </v-app>
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
      messages: [],
    };
  },
  created() {
    this.messages = [
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
      {sender: "홍길동", text: "넵, 조금 있다가 메일로 정리해서 보내드릴게요."},
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
    ];
  },
  methods: {
    sendMessage() {
      if (this.input.trim()) {
        this.messages.push({sender: this.user.name, text: this.input});
        this.input = "";
        this.$nextTick(() => {
          const container = this.$el.querySelector(".chat-body");
          container.scrollTop = container.scrollHeight;
        });
      }
    },
  },
};
</script>

<style scoped>
.chat-wrapper {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 64px); /* 👈 정확한 높이 조정 (예: 입력창 높이) */
  overflow: hidden;
}
.chat-body {
  flex-grow: 1;
  overflow-y: auto;
  padding: 8px;
  margin-bottom: 8px;

  /* 스크롤바 스타일 */
  scrollbar-width: thin;
  scrollbar-color: #c0c0c0 transparent;
}
.chat-body::-webkit-scrollbar {
  width: 8px;
}
.chat-body::-webkit-scrollbar-thumb {
  background-color: #c0c0c0;
  border-radius: 8px;
}
.chat-body::-webkit-scrollbar-track {
  background: transparent;
}

/* 고정된 입력창 */
.chat-input-bar {
  display: flex;
  align-items: center;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background-color: #fff;
  border-top: 1px solid #ddd;
  z-index: 10;
}

/* 말풍선 스타일 */
.chat-message {
  display: flex;
  margin-bottom: 8px;
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
  font-size: 0.8rem;
  font-weight: bold;
  margin-bottom: 4px;
}
</style>
