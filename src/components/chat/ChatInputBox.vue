<template>
  <div class="chat-input">
    <!-- NOTE: Assistant/Model selectors are intentionally NOT rendered in main UI.
         Playground provides context controls on the left panel.
         In main flow, assistant selection is done via Sidebar, and model via templates/model default. -->

    <div class="input-top">
      <InputHeader />
      <PromptTemplateForm v-if="inputMode !== 'direct' && inputMode !== 'code'">
        <template v-if="inputMode === 'email'" #top>
          <div class="ptf-top">
            <div class="ptf-email-row">
              <input class="ptf-email-in" v-model="email.to" placeholder="받는사람 (to)" />
              <input class="ptf-email-in" v-model="email.subject" placeholder="제목" />
            </div>
          </div>
        </template>
      </PromptTemplateForm>
    </div>

    <!-- hidden file picker (shared across modes) -->
    <input
      ref="filePicker"
      class="file-input"
      type="file"
      multiple
      :accept="acceptString"
      @change="onFilePicked"
    />

    <!-- mode-specific body (keeps the component usable even without parents) -->
    <div class="mode-body">
      <!-- DIRECT -->
      <div
        v-if="inputMode === 'direct'"
        class="composer"
        :class="{ dragging: isDragging }"
        @dragenter.prevent="onDragEnter"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
      >
        <ChatAttachmentTray :items="pendingFiles" @remove="removePending" />

        <textarea
          v-model="input"
          ref="taDirect"
          class="composer-ta"
          rows="2"
          placeholder="메시지를 입력하세요…"
          @keydown="onKeydown"
          @compositionstart="isComposing = true"
          @compositionend="isComposing = false"
          @dragenter.prevent="onDragEnter"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
        />

        <div v-if="isDragging" class="drop-overlay" aria-hidden="true">
          <div class="drop-card">
            <AppIcon name="paperclip" size="md" />
            <div class="drop-text">파일을 여기에 놓아 첨부</div>
            <div class="drop-sub">pdf · doc/docx · jpg · png</div>
          </div>
        </div>
        <button
          type="button"
          class="attach-btn"
          :disabled="isLocked"
          @click="openPicker"
          aria-label="Attach files"
        >
          <AppIcon name="paperclip" size="sm" />
        </button>

        <!-- ✅ input 있거나 첨부가 있으면 Send, 없으면 Mic -->
        <button
          v-if="hasTextInput"
          type="button"
          class="send-btn"
          :disabled="isLocked"
          @click="send"
          aria-label="Send"
        >
          <AppIcon name="send" size="sm" />
        </button>

        <SpeechMicButton
          v-else
          class="send-btn"
          v-model="input"
          :disabled="isLocked"
          :speech-options="speechOptions"
          @started="onSpeechStarted"
          @stopped="onSpeechStopped"
          @error="onSpeechError"
        />
      </div>

      <!-- EMAIL -->
      <div v-else-if="inputMode === 'email'" class="form">
        <div
          class="composer"
          :class="{ dragging: isDragging }"
          @dragenter.prevent="onDragEnter"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
        >
          <ChatAttachmentTray :items="pendingFiles" @remove="removePending" />
          <textarea
            class="composer-ta"
            ref="taEmail"
            v-model="email.body"
            rows="3"
            placeholder="내용"
            @keydown="onKeydown"
          />
          <div v-if="isDragging" class="drop-overlay" aria-hidden="true">
            <div class="drop-card">
              <AppIcon name="paperclip" size="md" />
              <div class="drop-text">파일을 여기에 놓아 첨부</div>
              <div class="drop-sub">pdf · doc/docx · jpg · png</div>
            </div>
          </div>
          <button
            type="button"
            class="attach-btn"
            :disabled="isLocked"
            @click="openPicker"
            aria-label="Attach"
          >
            <AppIcon name="paperclip" size="sm" />
          </button>
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
      </div>

      <!-- TRANSLATE -->
      <div v-else-if="inputMode === 'translate'" class="form">
        <div
          class="composer"
          :class="{ dragging: isDragging }"
          @dragenter.prevent="onDragEnter"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
        >
          <ChatAttachmentTray :items="pendingFiles" @remove="removePending" />
          <textarea
            class="composer-ta"
            ref="taTranslate"
            v-model="tr.text"
            rows="3"
            placeholder="번역할 텍스트"
            @keydown="onKeydown"
          />
          <div v-if="isDragging" class="drop-overlay" aria-hidden="true">
            <div class="drop-card">
              <AppIcon name="paperclip" size="md" />
              <div class="drop-text">파일을 여기에 놓아 첨부</div>
              <div class="drop-sub">pdf · doc/docx · jpg · png</div>
            </div>
          </div>
          <button
            type="button"
            class="attach-btn"
            :disabled="isLocked"
            @click="openPicker"
            aria-label="Attach"
          >
            <AppIcon name="paperclip" size="sm" />
          </button>
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
      </div>

      <!-- SUMMARY -->
      <div v-else-if="inputMode === 'summary'" class="form">
        <div
          class="composer"
          :class="{ dragging: isDragging }"
          @dragenter.prevent="onDragEnter"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
        >
          <textarea
            class="composer-ta"
            ref="taSummary"
            v-model="sum.text"
            rows="3"
            placeholder="요약할 텍스트"
            @keydown="onKeydown"
          />
          <div v-if="isDragging" class="drop-overlay" aria-hidden="true">
            <div class="drop-card">
              <AppIcon name="paperclip" size="md" />
              <div class="drop-text">파일을 여기에 놓아 첨부</div>
              <div class="drop-sub">pdf · doc/docx · jpg · png</div>
            </div>
          </div>
          <button
            type="button"
            class="attach-btn"
            :disabled="isLocked"
            @click="openPicker"
            aria-label="Attach"
          >
            <AppIcon name="paperclip" size="sm" />
          </button>
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
      </div>

      <!-- CODE -->
      <div v-else-if="inputMode === 'code'" class="form">
        <div
          class="composer"
          :class="{ dragging: isDragging }"
          @dragenter.prevent="onDragEnter"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
        >
          <ChatAttachmentTray :items="pendingFiles" @remove="removePending" />
          <textarea
            class="composer-ta"
            ref="taCode"
            v-model="code.text"
            rows="3"
            placeholder="코드/설명"
            @keydown="onKeydown"
          />
          <div v-if="isDragging" class="drop-overlay" aria-hidden="true">
            <div class="drop-card">
              <AppIcon name="paperclip" size="md" />
              <div class="drop-text">파일을 여기에 놓아 첨부</div>
              <div class="drop-sub">pdf · doc/docx · jpg · png</div>
            </div>
          </div>
          <button
            type="button"
            class="attach-btn"
            :disabled="isLocked"
            @click="openPicker"
            aria-label="Attach"
          >
            <AppIcon name="paperclip" size="sm" />
          </button>
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
      </div>
    </div>
  </div>
</template>

<script>
import InputHeader from "./InputHeader.vue";
import PromptTemplateForm from "./PromptTemplateForm.vue";
import { useChatStore } from "@/stores/chatStore";
import AppIcon from "@/components/common/AppIcon.vue";
import ChatAttachmentTray from "./ChatAttachmentTray.vue";
import SpeechMicButton from "./SpeechMicButton.vue";
import { getSpeech } from "@/managers/speechManager";

export default {
  name: "ChatInputBox",
  components: {
    InputHeader,
    PromptTemplateForm,
    AppIcon,
    ChatAttachmentTray,
    SpeechMicButton,
  },

  data() {
    return {
      isComposing: false,
      isDragging: false,
      _dragCounter: 0,
      _speech: null,
    };
  },

  created() {
    this.chat.ensureInitialized();
    this._speech = getSpeech();
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

    pendingFiles() {
      return Array.isArray(this.chat.pendingFiles)
        ? this.chat.pendingFiles
        : [];
    },

    acceptString() {
      // keep extension-based accept (mime is inconsistent for some browsers)
      return ".pdf,.doc,.docx,.png,.jpg,.jpeg";
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

    // ✅ Direct: text input only => can send. Attachments do NOT toggle send.
    hasTextInput() {
      const txt = String(this.input || "").trim();
      return txt.length > 0;
    },

    // Default speech options (can be overridden by other components too)
    speechOptions() {
      return {
        lang: "ko-KR",
        continuous: true,
        interimResults: true,
      };
    },
  },

  methods: {
    onSpeechStarted() {
      // no-op (hook for future)
    },
    onSpeechStopped() {
      // no-op
    },
    onSpeechError() {
      // no-op
    },

    _stopSpeechIfActive() {
      const sp = this._speech;
      if (sp && typeof sp.isActive === "function" && sp.isActive()) {
        try {
          sp.stop();
        } catch {
          // ignore
        }
      }
    },
    openPicker() {
      if (this.isLocked) return;
      const el = this.$refs.filePicker;
      if (el && typeof el.click === "function") el.click();
    },

    onFilePicked(e) {
      const files = Array.from(e?.target?.files || []);
      this.addFiles(files);
      // reset value so picking same file again triggers change
      if (e?.target) e.target.value = "";
    },

    onDragEnter(ev) {
      if (!this._hasFiles(ev)) return;
      this._dragCounter += 1;
      this.isDragging = true;
    },

    onDragOver(ev) {
      if (!this._hasFiles(ev)) return;
      this.isDragging = true;
    },

    onDragLeave() {
      this._dragCounter = Math.max(0, this._dragCounter - 1);
      if (this._dragCounter === 0) this.isDragging = false;
    },

    onDrop(ev) {
      if (!this._hasFiles(ev)) {
        this.isDragging = false;
        this._dragCounter = 0;
        return;
      }
      const files = Array.from(ev?.dataTransfer?.files || []);
      this.addFiles(files);
      this.isDragging = false;
      this._dragCounter = 0;
    },

    _hasFiles(ev) {
      const dt = ev?.dataTransfer;
      if (!dt) return false;
      if (Array.isArray(dt.types) && dt.types.includes("Files")) return true;
      if (dt.types && typeof dt.types.contains === "function") {
        return dt.types.contains("Files");
      }
      return false;
    },

    addFiles(files) {
      const next = [];
      for (const f of files) {
        const item = this._normalizeFile(f);
        if (!item) continue;
        // prevent exact duplicates by name+size+lastModified
        const exists = this.pendingFiles.some(
          (x) =>
            x?.name === item.name &&
            x?.size === item.size &&
            x?.lastModified === item.lastModified,
        );
        if (!exists) next.push(item);
      }
      if (next.length) this.chat.addPendingFiles(next);
    },

    removePending(id) {
      const it = this.pendingFiles.find((x) => x?.id === id);
      if (it?.previewUrl && String(it.previewUrl).startsWith("blob:")) {
        try {
          URL.revokeObjectURL(it.previewUrl);
        } catch {
          // ignore
        }
      }
      this.chat.removePendingFile(id);
    },

    _normalizeFile(file) {
      if (!file) return null;
      const name = String(file.name || "").trim();
      const ext = name.includes(".") ? name.split(".").pop().toLowerCase() : "";
      const allowed = new Set(["pdf", "doc", "docx", "png", "jpg", "jpeg"]);
      if (!allowed.has(ext)) return null;

      const isImage = ext === "png" || ext === "jpg" || ext === "jpeg";
      const previewUrl = isImage ? URL.createObjectURL(file) : null;

      return {
        id: `f_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        file,
        name,
        ext,
        type: file.type || "",
        size: typeof file.size === "number" ? file.size : 0,
        lastModified:
          typeof file.lastModified === "number" ? file.lastModified : 0,
        kind: isImage ? "image" : "file",
        previewUrl,
      };
    },
    // ✅ 현재 모드의 textarea(ref)에서 "보이는 값"을 직접 가져와서 store에 확정
    _getActiveEditorText() {
      const mode = this.inputMode || "direct";
      const refMap = {
        direct: "taDirect",
        email: "taEmail",
        translate: "taTranslate",
        summary: "taSummary",
        code: "taCode",
      };
      const key = refMap[mode] || "taDirect";
      const el = this.$refs[key];

      // Vue ref가 textarea DOM이면 value로 읽음
      if (el && typeof el.value === "string") {
        return el.value;
      }
      // fallback: store bound value
      if (mode === "direct") return String(this.input || "");
      if (mode === "email") return String(this.email.body || "");
      if (mode === "translate") return String(this.tr.text || "");
      if (mode === "summary") return String(this.sum.text || "");
      if (mode === "code") return String(this.code.text || "");
      return "";
    },

    send() {
      if (this.isLocked) return;

      // ✅ sending should stop speech
      this._stopSpeechIfActive();

      // ✅ 항상 최신 editor 값을 기반으로 최종 텍스트 확정
      let finalText = "";

      if (this.inputMode === "direct") {
        finalText = String(this._getActiveEditorText() || "").trim();
      } else {
        finalText = String(this.composeTextByMode() || "").trim();
      }

      // ✅ send button is shown only when text exists
      if (!finalText) return;

      // ✅ store send는 inputText만 봄 → 여기서 확정
      this.chat.setInputText(finalText);

      const wasNew = !this.activeChatId;

      this.chat.send();

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
        const to = (this.email.to || "").trim();
        const subject = (this.email.subject || "").trim();
        const body = String(
          this._getActiveEditorText() || this.email.body || "",
        ).trim();
        return `메일 작성\n- To: ${to || "(미지정)"}\n- Subject: ${subject || "(미지정)"}\n\n${body}`;
      }
      if (this.inputMode === "translate") {
        const text = String(
          this._getActiveEditorText() || this.tr.text || "",
        ).trim();
        return `번역 요청\n- From: ${this.tr.from}\n- To: ${this.tr.to}\n\n${text}`;
      }
      if (this.inputMode === "summary") {
        const text = String(
          this._getActiveEditorText() || this.sum.text || "",
        ).trim();
        return `요약 요청\n- Style: ${this.sum.style}\n- Limit: ${this.sum.limit || "(미지정)"}\n\n${text}`;
      }
      if (this.inputMode === "code") {
        const text = String(
          this._getActiveEditorText() || this.code.text || "",
        ).trim();
        return `코드 작업 요청\n- Lang: ${this.code.lang || "(미지정)"}\n- Task: ${this.code.task || "(미지정)"}\n\n${text}`;
      }
      return String(this.input || "");
    },

    onKeydown(e) {
      // ✅ any real typing stops speech
      const k = e?.key;
      if (k && k.length === 1) this._stopSpeechIfActive();

      // ✅ Enter to send (Shift+Enter = newline). Avoid during IME composing.
      if (k === "Enter" && !e.shiftKey && !this.isComposing) {
        e.preventDefault();
        if (this.hasTextInput) this.send();
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
  height: var(--control-h);
  border-radius: var(--control-radius);
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: linear-gradient(180deg, var(--bg-surface), var(--bg-elevated));
  color: var(--text-primary);
  padding: 0 var(--control-pad-x);
  outline: none;
  box-shadow: var(--shadow-xs, none);
}

.in:focus,
.sel:focus {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
}

.composer {
  /* breakpoint-aware sizing (auto via :root.bp-*) */
  --attach-size: var(--action-btn);
  --send-size: var(--action-btn);
  position: relative;
  display: block;
  padding: var(--space-3);
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--bg-surface) 80%, transparent),
    var(--bg-elevated)
  );
  box-shadow: var(--shadow-sm);
}

.composer.dragging {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 14%, transparent);
}

.file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
}

.drop-overlay {
  position: absolute;
  inset: var(--space-3);
  border-radius: 16px;
  background: color-mix(in srgb, var(--bg) 65%, transparent);
  border: 1px dashed color-mix(in srgb, var(--accent) 60%, var(--border));
  display: grid;
  place-items: center;
  z-index: 3;
  pointer-events: none;
}

.drop-card {
  display: grid;
  gap: 6px;
  text-align: center;
  padding: 12px 14px;
  border-radius: 16px;
  background: linear-gradient(180deg, var(--bg-surface), var(--bg-elevated));
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  box-shadow: var(--shadow-md);
  color: var(--text-primary);
}

.drop-text {
  font-size: 13px;
  font-weight: 650;
}

.drop-sub {
  font-size: 12px;
  color: var(--text-muted);
}

.attach-btn {
  width: var(--attach-size);
  height: var(--attach-size);
  border-radius: calc(var(--control-radius) - 4px);
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: color-mix(in srgb, var(--bg) 60%, transparent);
  color: var(--text-primary);
  position: absolute;
  left: calc(var(--space-3) + var(--space-2));
  bottom: calc(var(--space-3) + var(--space-2));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    filter 0.15s ease;
}

.attach-btn:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
  filter: saturate(1.05);
}

.attach-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.composer :deep(.tray) {
  margin-bottom: 10px;
}

.composer-ta {
  width: 100%;
  min-height: calc(var(--control-h) + var(--space-2));
  max-height: 200px;
  resize: none;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: color-mix(in srgb, var(--bg) 60%, transparent);
  color: var(--text-primary);
  border-radius: var(--control-radius);
  /* ✅ space reserved for attach/send buttons (responsive) */
  padding: var(--space-3) calc(var(--action-btn) + var(--space-4))
    calc(var(--action-btn) + var(--space-3))
    calc(var(--action-btn) + var(--space-4));
  outline: none;
  line-height: 1.4;
}

.composer-ta:focus {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent);
}

/* ✅ UI/UX 유지 + 위치/겹침만 해결 */
.send-btn {
  width: var(--send-size);
  height: var(--send-size);
  border-radius: var(--control-radius);
  border: 1px solid transparent;
  background: linear-gradient(
    135deg,
    var(--accent),
    var(--accent-2, var(--accent))
  );
  color: var(--accent-contrast);
  position: absolute;

  /* 🔧 너무 바닥/우측에 붙어서 스크롤 가림 → 살짝 띄움 */
  right: calc(var(--space-3) + var(--space-2));
  bottom: calc(var(--space-3) + var(--space-2));

  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  cursor: pointer;
  transition:
    transform 0.15s ease,
    filter 0.15s ease;

  /* 🔧 클릭이 textarea에 먹히는 케이스 방지 */
  z-index: 2;
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
  .chat-input {
    padding: 10px;
    max-height: 42vh;
    overflow: auto;
  }
  .composer-ta {
    max-height: 140px;
  }
}

/* =========================================================
   Mobile keyboard: keep input area visible
   ========================================================= */
@media (max-width: 720px) {
  .chat-input {
    position: sticky;
    bottom: 0;
    z-index: 20;
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }
}

</style>
