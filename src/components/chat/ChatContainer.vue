<template>
  <div class="chat-container">
    <div class="chat-container__header">
      <h1 class="chat-container__title">ChatGPT-like Responsive Chat</h1>
      <p class="chat-container__subtitle">
        Ask anything about Vue, Spring, SSE, WebClient, Redis, Studio 구조 등. 레이아웃은 화면 크기에 따라 자동 반응합니다.
      </p>
    </div>

    <div class="chat-container__main">
      <div class="chat-container__messages" ref="scrollArea">
        <ChatMessageList :messages="messages" :typing="typing" />
      </div>
      <div class="chat-container__input">
        <ChatInput @submit="handleUserMessage" />
      </div>
    </div>
  </div>
</template>

<script>
import ChatMessageList from "./ChatMessageList.vue";
import ChatInput from "./ChatInput.vue";

export default {
  name: "ChatContainer",
  components: { ChatMessageList, ChatInput },
  data() {
    return {
      messages: [
        {
          role: "assistant",
          content:
            "안녕하세요! DS Assistant UI Boilerplate 입니다. 아무 질문이나 해보세요. 반응형, 테마 토글, 사이드바까지 모두 포함되어 있습니다."
        }
      ],
      typing: false
    };
  },
  methods: {
    async handleUserMessage(text) {
      this.messages.push({ role: "user", content: text });
      this.scrollToBottom();

      this.typing = true;

      const reply = await this.mockAssistantReply(text);

      this.typing = false;
      this.messages.push({ role: "assistant", content: reply });
      this.$nextTick(() => this.scrollToBottom());
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const el = this.$refs.scrollArea;
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      });
    },
    mockAssistantReply(text) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(
            [
              "질문: " + text,
              "",
              "이 Boilerplate는:",
              "1. Vue 3 + Webpack 기반",
              "2. 테마 토글 (라이트/다크)",
              "3. 모바일/태블릿/PC 반응형 레이아웃",
              "4. 사이드바 + 헤더 + 푸터",
              "5. ChatGPT 스타일의 채팅 UI",
              "",
              "실제 프로젝트에 이 구조만 붙여서 바로 쓸 수 있게 설계했습니다."
            ].join("\n")
          );
        }, 800);
      });
    }
  }
};
</script>

<style lang="scss" scoped>
@import "@/assets/styles/mixins";

.chat-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  height: calc(
    100vh - var(--layout-header-height) - var(--layout-footer-height) - 2 *
      var(--space-4)
  );
}

.chat-container__header {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: linear-gradient(
    120deg,
    var(--color-primary-soft),
    transparent
  );
}

.chat-container__title {
  margin: 0 0 var(--space-1) 0;
  font-size: var(--font-size-lg);
}

.chat-container__subtitle {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.chat-container__main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.chat-container__messages {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}

.chat-container__input {
  position: sticky;
  bottom: 0;
}

@include mobile {
  .chat-container {
    height: calc(
      100vh - var(--layout-header-height) - var(--layout-footer-height) - 2 *
        var(--space-3)
    );
  }

  .chat-container__header {
    padding: var(--space-2) var(--space-3);
  }

  .chat-container__title {
    font-size: var(--font-size-md);
  }

  .chat-container__subtitle {
    font-size: var(--font-size-xs);
  }
}
</style>
