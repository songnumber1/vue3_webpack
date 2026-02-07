<template>
  <div v-if="items.length" class="tray" aria-label="Attachments">
    <div class="tray-list">
      <div v-for="it in items" :key="it.id" class="chip">
        <!-- image preview -->
        <div v-if="it.kind === 'image'" class="thumb">
          <img :src="it.previewUrl" :alt="it.name" />
        </div>

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
  methods: {
    iconFor(it) {
      const ext = String(it?.ext || "").toLowerCase();
      if (ext === "pdf") return "file";
      if (ext === "doc" || ext === "docx") return "file";
      return "file";
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
  width: 40px;
  height: 40px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--border) 60%, transparent);
  background: color-mix(in srgb, var(--bg) 70%, transparent);
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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
</style>
