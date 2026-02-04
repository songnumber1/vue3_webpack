<template>
  <div class="chat-input">
    <InputHeader />
    <PromptTemplateForm />

    <div class="input-main">
      <textarea
        v-model="input"
        rows="2"
        placeholder="메시지를 입력하세요"
        @keydown="onKeydown"
      />
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

  created() {
    this.chat.ensureInitialized();
  },

  computed: {
    chat() {
      return useChatStore();
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
    send() {
      if (this.isLocked) return;

      // ✅ ensure chat room exists
      if (!this.activeChatId) {
        const id = this.chat.createChat(this.input);
        // if router exists (preview/app), navigate to room
        if (id && this.$router) {
          try {
            this.$router.push(`/chat/${id}`);
          } catch (e) {
            // ignore
          }
        }
      }

      this.chat.send();
    },

    onKeydown(e) {
      if (e.key === "Enter" && !e.shiftKey) {
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
