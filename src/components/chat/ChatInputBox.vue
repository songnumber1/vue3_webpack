<template>
  <div class="chat-input">
    <!-- NOTE: Assistant/Model selectors are intentionally NOT rendered in main UI.
         Playground provides context controls on the left panel.
         In main flow, assistant selection is done via Sidebar, and model via templates/model default. -->

    <InputHeader />
    <PromptTemplateForm />

    <!-- mode-specific body (keeps the component usable even without parents) -->
    <div class="mode-body">
      <!-- DIRECT -->
      <div v-if="inputMode === 'direct'" class="input-main">
        <textarea
          v-model="input"
          rows="2"
          placeholder="메시지를 입력하세요"
          @keydown="onKeydown"
          @compositionstart="isComposing = true"
          @compositionend="isComposing = false"
        />
      </div>

      <!-- EMAIL -->
      <div v-else-if="inputMode === 'email'" class="form">
        <div class="row">
          <input class="in" v-model="email.to" placeholder="받는사람 (to)" />
          <input class="in" v-model="email.subject" placeholder="제목" />
        </div>
        <textarea class="ta" v-model="email.body" rows="3" placeholder="내용" />
      </div>

      <!-- TRANSLATE -->
      <div v-else-if="inputMode === 'translate'" class="form">
        <div class="row">
          <input class="in" v-model="tr.from" placeholder="원문 언어 (예: ko)" />
          <input class="in" v-model="tr.to" placeholder="목표 언어 (예: en)" />
        </div>
        <textarea class="ta" v-model="tr.text" rows="3" placeholder="번역할 텍스트" />
      </div>

      <!-- SUMMARY -->
      <div v-else-if="inputMode === 'summary'" class="form">
        <div class="row">
          <select class="sel" v-model="sum.style">
            <option value="bullet">불릿</option>
            <option value="short">짧게</option>
            <option value="detailed">자세히</option>
          </select>
          <input class="in" v-model="sum.limit" placeholder="분량 (예: 5줄)" />
        </div>
        <textarea class="ta" v-model="sum.text" rows="3" placeholder="요약할 텍스트" />
      </div>

      <!-- CODE -->
      <div v-else-if="inputMode === 'code'" class="form">
        <div class="row">
          <input class="in" v-model="code.lang" placeholder="언어 (예: java, js)" />
          <input class="in" v-model="code.task" placeholder="요청 (예: 리팩토링, 버그 수정)" />
        </div>
        <textarea class="ta" v-model="code.text" rows="3" placeholder="코드/설명" />
      </div>
    </div>

    <div class="actions">
      <button type="button" class="send" :disabled="isLocked" @click="send">
        Send
      </button>
    </div>
  </div>
</template>

<script>
import InputHeader from "./InputHeader.vue";
import PromptTemplateForm from "./PromptTemplateForm.vue";
import { useChatStore } from "@/stores/chatStore";

export default {
  name: "ChatInputBox",
  components: { InputHeader, PromptTemplateForm },

  data() {
    return {
      isComposing: false,
            email: { to: "", subject: "", body: "" },
      tr: { from: "ko", to: "en", text: "" },
      sum: { style: "bullet", limit: "", text: "" },
      code: { lang: "", task: "", text: "" },
    };
  },

  created() {
    this.chat.ensureInitialized();
  },

  computed: {
    chat() {
      return useChatStore();
    },
    inputMode() {
      return this.chat.inputMode || "direct";
    },
    input: {
      get() {
        return this.chat.inputText;
      },
      set(v) {
        this.chat.setInputText(v);
      },
    },
    isLocked() {
      return this.chat.isLocked;
    },
    activeChatId() {
      return this.chat.activeChatId;
    },
  },

  methods: {
    resetModeDrafts() {
      this.email = { to: "", subject: "", body: "" };
      this.tr = { from: "ko", to: "en", text: "" };
      this.sum = { style: "bullet", limit: "", text: "" };
      this.code = { lang: "", task: "", text: "" };
    },

    send() {
      if (this.isLocked) return;

      // ✅ compose final message by inputMode
      if (this.inputMode !== "direct") {
        const composed = this.composeTextByMode();
        this.chat.setInputText(composed);
      }

      const wasNew = !this.activeChatId;

      // ✅ send (store will create chat room on first submit)
      this.chat.send();

      // ✅ if this was a new chat, navigate to newly created room (when router exists)
      if (wasNew && this.chat.activeChatId && this.$router) {
        try {
          this.$router.push(`/chat/${this.chat.activeChatId}`);
        } catch (e) {
          // ignore
        }
      }
    },

    composeTextByMode() {
      if (this.inputMode === "email") {
        const to = this.email.to.trim();
        const subject = this.email.subject.trim();
        const body = this.email.body.trim();
        return `메일 작성\n- To: ${to || "(미지정)"}\n- Subject: ${subject || "(미지정)"}\n\n${body}`;
      }
      if (this.inputMode === "translate") {
        return `번역 요청\n- From: ${this.tr.from}\n- To: ${this.tr.to}\n\n${this.tr.text}`;
      }
      if (this.inputMode === "summary") {
        return `요약 요청\n- Style: ${this.sum.style}\n- Limit: ${this.sum.limit || "(미지정)"}\n\n${this.sum.text}`;
      }
      if (this.inputMode === "code") {
        return `코드 작업 요청\n- Lang: ${this.code.lang || "(미지정)"}\n- Task: ${this.code.task || "(미지정)"}\n\n${this.code.text}`;
      }
      return String(this.input || "");
    },

    onKeydown(e) {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing && !this.isComposing) {
        e.preventDefault();
        this.send();
      }
    },
  },
};
</script>

<style scoped>
.chat-input {
  border-top: 1px solid var(--border);
  background: var(--bg);
  padding: 12px;
  display: grid;
  gap: 10px;
}

.top {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.field { display: grid; gap: 6px; }
.lbl { font-size: 12px; color: var(--muted); }

.sel {
  height: 36px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text);
  padding: 0 10px;
}

.modes {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mode {
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  border-radius: 999px;
  padding: 7px 12px;
  font-size: 12px;
  cursor: pointer;
}

.mode.active {
  background: var(--bg-surface);
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(100, 149, 237, 0.15);
  font-weight: 800;
}

.mode-body { display: grid; gap: 10px; }

.form { display: grid; gap: 10px; }
.row { display: grid; gap: 10px; grid-template-columns: 1fr 1fr; }
.in {
  height: 40px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text);
  padding: 0 12px;
  outline: none;
}
.ta {
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text);
  padding: 10px 12px;
  outline: none;
  resize: vertical;
}

.input-main {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

textarea {
  flex: 1;
  min-height: 56px;
  max-height: 180px;
  resize: vertical;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text);
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;
}

.actions { display: flex; justify-content: flex-end; }

.send {
  height: 40px;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--accent);
  color: white;
  cursor: pointer;
}

.send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
