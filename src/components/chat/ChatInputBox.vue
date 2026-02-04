<template>
  <div class="chat-input">
    <!-- NOTE: Assistant/Model selectors are intentionally NOT rendered in main UI.
         Playground provides context controls on the left panel.
         In main flow, assistant selection is done via Sidebar, and model via templates/model default. -->

    <div class="input-top">
      <InputHeader />
      <PromptTemplateForm />
    </div>

    <!-- mode-specific body (keeps the component usable even without parents) -->
    <div class="mode-body">
      <!-- DIRECT -->
      <div v-if="inputMode === 'direct'" class="composer">
        <textarea
          v-model="input"
          class="composer-ta"
          rows="2"
          placeholder="메시지를 입력하세요…"
          @keydown="onKeydown"
          @compositionstart="isComposing = true"
          @compositionend="isComposing = false"
        />

        <button
          type="button"
          class="send-btn"
          :disabled="isLocked"
          @click="send"
          aria-label="Send"
        >
          <AppIcon name="send" size="sm" />
        </button>
      </div>

      <!-- EMAIL -->
      <div v-else-if="inputMode === 'email'" class="form">
        <div class="row">
          <input class="in" v-model="email.to" placeholder="받는사람 (to)" />
          <input class="in" v-model="email.subject" placeholder="제목" />
        </div>
        <div class="composer">
          <textarea class="composer-ta" v-model="email.body" rows="3" placeholder="내용" />
          <button type="button" class="send-btn" :disabled="isLocked" @click="send" aria-label="Send">
            <AppIcon name="send" size="sm" />
          </button>
        </div>
      </div>

      <!-- TRANSLATE -->
      <div v-else-if="inputMode === 'translate'" class="form">
        <div class="row">
          <input class="in" v-model="tr.from" placeholder="원문 언어 (예: ko)" />
          <input class="in" v-model="tr.to" placeholder="목표 언어 (예: en)" />
        </div>
        <div class="composer">
          <textarea class="composer-ta" v-model="tr.text" rows="3" placeholder="번역할 텍스트" />
          <button type="button" class="send-btn" :disabled="isLocked" @click="send" aria-label="Send">
            <AppIcon name="send" size="sm" />
          </button>
        </div>
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
        <div class="composer">
          <textarea class="composer-ta" v-model="sum.text" rows="3" placeholder="요약할 텍스트" />
          <button type="button" class="send-btn" :disabled="isLocked" @click="send" aria-label="Send">
            <AppIcon name="send" size="sm" />
          </button>
        </div>
      </div>

      <!-- CODE -->
      <div v-else-if="inputMode === 'code'" class="form">
        <div class="row">
          <input class="in" v-model="code.lang" placeholder="언어 (예: java, js)" />
          <input class="in" v-model="code.task" placeholder="요청 (예: 리팩토링, 버그 수정)" />
        </div>
        <div class="composer">
          <textarea class="composer-ta" v-model="code.text" rows="3" placeholder="코드/설명" />
          <button type="button" class="send-btn" :disabled="isLocked" @click="send" aria-label="Send">
            <AppIcon name="send" size="sm" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import InputHeader from "./InputHeader.vue";
import PromptTemplateForm from "./PromptTemplateForm.vue";
import { useChatStore } from "@/stores/chatStore";
import AppIcon from "@/components/common/AppIcon.vue";

export default {
  name: "ChatInputBox",
  components: { InputHeader, PromptTemplateForm, AppIcon },

  data() {
    return {
      isComposing: false,
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

    // ✅ bind drafts to store (so example clicks update the visible editor)
    email: {
      get() {
        return this.chat.modeDrafts.email;
      },
      set(v) {
        this.chat.modeDrafts.email = { ...v };
      },
    },
    tr: {
      get() {
        return this.chat.modeDrafts.translate;
      },
      set(v) {
        this.chat.modeDrafts.translate = { ...v };
      },
    },
    sum: {
      get() {
        return this.chat.modeDrafts.summary;
      },
      set(v) {
        this.chat.modeDrafts.summary = { ...v };
      },
    },
    code: {
      get() {
        return this.chat.modeDrafts.code;
      },
      set(v) {
        this.chat.modeDrafts.code = { ...v };
      },
    },
    activeChatId() {
      return this.chat.activeChatId;
    },
  },

  methods: {
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

.input-top {
  display: grid;
  gap: 10px;
}

.mode-body {
  display: grid;
  gap: 10px;
}

.form {
  display: grid;
  gap: 10px;
}

.row {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr;
}

.in,
.sel {
  height: 40px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: linear-gradient(180deg, var(--bg-surface), var(--bg-elevated));
  color: var(--text-primary);
  padding: 0 12px;
  outline: none;
  box-shadow: var(--shadow-xs, none);
}

.in:focus,
.sel:focus {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
}

.composer {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  align-items: end;
  padding: 10px;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: linear-gradient(180deg, color-mix(in srgb, var(--bg-surface) 80%, transparent), var(--bg-elevated));
  box-shadow: var(--shadow-sm);
}

.composer-ta {
  width: 100%;
  min-height: 52px;
  max-height: 200px;
  resize: vertical;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: color-mix(in srgb, var(--bg) 60%, transparent);
  color: var(--text-primary);
  border-radius: 14px;
  padding: 10px 12px;
  outline: none;
  line-height: 1.4;
}

.composer-ta:focus {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
}

.send-btn {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid transparent;
  background: linear-gradient(135deg, var(--accent), var(--accent-2, var(--accent)));
  color: var(--accent-contrast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition: transform 0.15s ease, filter 0.15s ease;
}

.send-btn:hover {
  transform: translateY(-1px);
  filter: saturate(1.1);
}

.send-btn:active {
  transform: translateY(0);
}

.send-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 520px) {
  .row {
    grid-template-columns: 1fr;
  }
}
</style>
