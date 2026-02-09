<template>
  <button
    type="button"
    class="mic-btn"
    :class="{ active: active, unsupported: !supported }"
    :disabled="disabled || !supported"
    :aria-label="active ? 'Stop voice input' : 'Start voice input'"
    @click="onToggle"
  >
    <AppIcon :name="active ? 'mic-off' : 'mic'" size="sm" />
  </button>
</template>

<script>
import AppIcon from "@/components/common/AppIcon.vue";
import { getSpeech } from "@/managers/speechManager";

export default {
  name: "SpeechMicButton",
  components: { AppIcon },

  props: {
    /** current text in the editor (v-model) */
    modelValue: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
    /** optional speech options override */
    speechOptions: { type: Object, default: () => ({}) },
  },

  emits: ["update:modelValue", "started", "speaking", "stopped", "error"],

  data() {
    const speech = getSpeech();
    return {
      speech,
      active: speech?.isActive?.() || false,
      supported: speech?.isSupported?.() || false,
    };
  },

  methods: {
    onToggle() {
      if (!this.speech || !this.supported) return;

      // If active -> stop (cancel)
      if (this.speech.isActive()) {
        this.speech.stop();
        this.active = false;
        this.$emit("stopped");
        return;
      }

      const opts = this.speechOptions || {};

      const res = this.speech.start(
        {
          onText: (text) => {
            this.active = this.speech.isActive();
            this.$emit("update:modelValue", text);
            this.$emit("speaking", text);
          },
          onFinal: (text) => {
            this.$emit("update:modelValue", text);
          },
          onEnd: () => {
            this.active = false;
            this.$emit("stopped");
          },
          onError: (err) => {
            this.active = false;
            this.$emit("error", err);
          },
        },
        opts,
      );

      this.active = !!res?.ok;
      if (this.active) this.$emit("started");
      if (!this.active) this.$emit("error", res);
    },
  },
};
</script>

<style scoped>
.mic-btn {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: linear-gradient(180deg, var(--bg-surface), var(--bg-elevated));
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition:
    transform 0.15s ease,
    background 0.15s ease;
}

.mic-btn:hover {
  transform: translateY(-1px);
}

.mic-btn:active {
  transform: translateY(0);
}

.mic-btn.active {
  border-color: color-mix(in srgb, var(--accent) 55%, var(--border));
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--accent) 20%, var(--bg-surface)),
    var(--bg-elevated)
  );
}

.mic-btn.unsupported {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
