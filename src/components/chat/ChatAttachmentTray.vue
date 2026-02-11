<template>
  <div v-if="items.length" class="tray" aria-label="Attachments">
    <div class="tray-list">
      <div v-for="it in items" :key="it.id" class="chip">
        <!-- image preview -->
        <button
          v-if="it.kind === 'image'"
          type="button"
          class="thumb"
          @click="openImage(it)"
          :aria-label="`Open image ${it.name}`"
        >
          <img :src="it.previewUrl" :alt="it.name" />
          <span class="thumb-hint" aria-hidden="true">
            <AppIcon name="zoom" size="xs" />
          </span>
        </button>

        <!-- non-image file badge -->
        <div v-else class="file">
          <div class="file-icon" aria-hidden="true">
            <AppIcon :name="iconFor(it)" size="sm" />
          </div>
          <div class="file-meta">
            <div class="file-name" :title="it.name">{{ it.name }}</div>
            <div class="file-ext">{{ it.ext.toUpperCase() }}</div>
          </div>
        </div>

        <button
          v-if="!readonly"
          type="button"
          class="rm"
          @click="$emit('remove', it.id)"
          aria-label="Remove"
        >
          <AppIcon name="x" size="xs" />
        </button>
      </div>
    </div>
  </div>

  <!-- Image viewer (teleport to body to avoid layout constraints) -->
  <teleport to="body">
    <div
      v-if="viewer.open"
      class="viewer"
      role="dialog"
      aria-modal="true"
      @click.self="closeViewer"
    >
      <div class="viewer-card">
        <div class="viewer-top">
          <div class="viewer-title" :title="viewer.title">
            {{ viewer.title }}
          </div>
          <button
            type="button"
            class="viewer-close"
            @click="closeViewer"
            aria-label="Close"
          >
            <AppIcon name="x" size="sm" />
          </button>
        </div>
        <div class="viewer-body">
          <img class="viewer-img" :src="viewer.src" :alt="viewer.title" />
        </div>
      </div>
    </div>
  </teleport>
</template>

<script>
import AppIcon from "@/components/common/AppIcon.vue";

export default {
  name: "ChatAttachmentTray",
  components: { AppIcon },
  props: {
    items: { type: Array, default: () => [] },
    readonly: { type: Boolean, default: false },
  },
  data() {
    return {
      viewer: {
        open: false,
        src: "",
        title: "",
      },
    };
  },
  watch: {
    "viewer.open"(v) {
      // close on ESC
      if (v) window.addEventListener("keydown", this.onKeydown);
      else window.removeEventListener("keydown", this.onKeydown);
    },
  },
  beforeUnmount() {
    window.removeEventListener("keydown", this.onKeydown);
  },
  methods: {
    iconFor(it) {
      const ext = String(it?.ext || "").toLowerCase();
      if (ext === "pdf") return "file";
      if (ext === "doc" || ext === "docx") return "file";
      return "file";
    },
    openImage(it) {
      // Support both previewUrl (object URL) and a persisted url
      const src = it.previewUrl || it.url;
      if (!src) return;
      this.viewer.open = true;
      this.viewer.src = src;
      this.viewer.title = it.name || "image";
    },
    closeViewer() {
      this.viewer.open = false;
      this.viewer.src = "";
      this.viewer.title = "";
    },
    onKeydown(e) {
      if (e.key === "Escape") this.closeViewer();
    },
  },
};
</script>

<style scoped>
.tray {
  margin: 10px 0 8px;
}

.tray-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 38px 8px 10px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: linear-gradient(180deg, var(--bg-surface), var(--bg-elevated));
  box-shadow: var(--shadow-xs, none);
  max-width: 280px;
}

.thumb {
  appearance: none;
  border: none;
  padding: 0;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  background: color-mix(in srgb, var(--bg) 70%, transparent);
  position: relative;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.thumb-hint {
  position: absolute;
  right: 6px;
  bottom: 6px;
  width: 18px;
  height: 18px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--bg) 74%, transparent);
  border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  color: var(--text-primary);
  opacity: 0.95;
}

.thumb:hover {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
}

.file {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.file-icon {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 22%, transparent);
  color: var(--text-primary);
}

.file-meta {
  display: grid;
  line-height: 1.15;
}

.file-name {
  font-size: 12px;
  color: var(--text-primary);
  max-width: 176px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-ext {
  font-size: 11px;
  color: var(--text-muted);
}

.rm {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  background: color-mix(in srgb, var(--bg) 60%, transparent);
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0.85;
}

.chip:hover .rm {
  opacity: 1;
}

.rm:hover {
  color: var(--text-primary);
  border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
}

/* =========================
 * Image viewer modal
 * ========================= */
.viewer {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: color-mix(in srgb, var(--bg) 45%, black);
  display: grid;
  place-items: center;
  padding: 18px;
}

.viewer-card {
  width: min(980px, 94vw);
  max-height: 92vh;
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
  background: linear-gradient(180deg, var(--bg-surface), var(--bg-elevated));
  box-shadow: var(--shadow-lg, 0 24px 60px rgba(0, 0, 0, 0.22));
  overflow: hidden;
}

.viewer-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 12px 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--border) 70%, transparent);
}

.viewer-title {
  font-size: 13px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.viewer-close {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  background: color-mix(in srgb, var(--bg) 60%, transparent);
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.viewer-close:hover {
  color: var(--text-primary);
  border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
}

.viewer-body {
  padding: 14px;
  max-height: calc(92vh - 56px);
  overflow: auto;
}

.viewer-img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  background: color-mix(in srgb, var(--bg) 70%, transparent);
}
</style>
