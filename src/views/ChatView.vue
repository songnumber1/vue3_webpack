<template>
  <div class="content">
    <div class="chat-box">
      <div class="messages" ref="messages">
        <div
          v-if="isDraft && messages.length === 0"
          style="color: var(--muted); padding: 8px"
        >
          새 대화를 시작하세요. 첫 메시지 전송 시 좌측 이력에 추가됩니다.
        </div>

        <div v-for="(m, i) in messages" :key="i" class="msg" :class="m.role">
          <div class="bubble" v-html="render(m.text)"></div>
        </div>
      </div>

      <div class="input-row">
        <textarea
          v-model="input"
          rows="2"
          placeholder="메시지를 입력하세요 (Markdown / Mermaid / Math 지원)"
          @keydown.enter.exact.prevent="send"
          @keydown.enter.shift.stop
        ></textarea>
        <button @click="send">Send</button>
      </div>
    </div>
  </div>
</template>

<script>
import { createChatFromFirstMessage } from "../services/chatStore";
import { md } from "../utils/markdown";
import mermaid from "mermaid";

let mermaidInited = false;

export default {
  props: { store: { type: Object, required: true } },
  data() {
    return { input: "" };
  },
  computed: {
    isDraft() {
      return !!this.store.draft || !this.store.activeChatId;
    },
    activeChat() {
      return (
        (this.store.chats || []).find(
          (c) => c.id === this.store.activeChatId
        ) || null
      );
    },
    messages() {
      return this.activeChat ? this.activeChat.messages : [];
    },
  },
  methods: {
    render(text) {
      return md.render(text || "");
    },

    ensureChatCreated(firstText) {
      if (this.store.activeChatId) return;
      const chat = createChatFromFirstMessage(firstText);
      this.store.chats.unshift(chat);
      this.store.activeChatId = chat.id;
      this.store.draft = false;
      this.$emit("store:update", this.store);
    },

    send() {
      const text = (this.input || "").trim();
      if (!text) return;

      this.ensureChatCreated(text);

      this.activeChat.messages.push({ role: "user", text });
      this.input = "";
      this.$emit("store:update", this.store);
      this.afterRender();

      // mock AI 응답 (mermaid/math 샘플 포함)
      setTimeout(() => {
        this.activeChat.messages.push({
          role: "ai",
          text: `**Markdown/Math/Mermaid 예시**

인라인 수식: $E = mc^2$

블록 수식:
$$
\int_0^1 x^2 dx = \frac{1}{3}
$$

\`\`\`mermaid
flowchart LR
  A[User] --> B[Markdown 렌더]
  B --> C[Mermaid run]
  B --> D[KaTeX]
\`\`\`
`,
        });
        this.$emit("store:update", this.store);
        this.afterRender();
      }, 450);
    },

    afterRender() {
      this.$nextTick(() => {
        this.scrollToBottom();
        this.runMermaidSafe();
      });
    },

    scrollToBottom() {
      const el = this.$refs.messages;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    },

    runMermaidSafe() {
      // mermaid 초기화는 1회만
      if (!mermaidInited) {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
        });
        mermaidInited = true;
      }
      const root = this.$refs.messages;
      if (!root) return;

      // 이미 처리된 노드는 mermaid가 data-processed를 붙입니다.
      // mermaid.run은 내부적으로 해당 처리를 존중합니다.
      // requestAnimationFrame으로 DOM 안정화 후 실행
      requestAnimationFrame(() => {
        try {
          mermaid.run({ nodes: root.querySelectorAll(".mermaid") });
        } catch (e) {
          // 렌더 실패해도 앱이 죽지 않게 무시 (사용자 입력 오류 가능)
          // 필요하면 console.warn(e)
        }
      });
    },
  },
  mounted() {
    this.afterRender();
  },
  updated() {
    // 선택 채팅 변경/라우트 이동 등에서도 안전하게 후처리
    this.afterRender();
  },
};
</script>
