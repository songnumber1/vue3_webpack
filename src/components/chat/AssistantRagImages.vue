<template>
  <section v-if="normalizedItems.length" class="assistant-rag-images">
    <div class="assistant-rag-images__title">연관 이미지</div>
    <div class="assistant-rag-images__grid" aria-label="연관 이미지 목록">
      <a
        v-for="(item, index) in normalizedItems"
        :key="`${item.url}-${index}`"
        class="assistant-rag-images__card"
        :href="item.linkUrl || item.url"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          class="assistant-rag-images__image"
          :src="item.url"
          :alt="item.alt"
          loading="lazy"
          decoding="async"
          draggable="false"
        />
        <span v-if="item.title" class="assistant-rag-images__caption">
          {{ item.title }}
        </span>
      </a>
    </div>
  </section>
</template>

<script setup>
/**
 * @file components/chat/AssistantRagImages.vue
 * @description 답변 하단에 API/mock ragimage 배열로 전달되는 연관 이미지 목록을 표시합니다.
 */

import {computed} from "vue";

const props = defineProps({
  items: {type: Array, default: () => []},
});

function firstText(...values) {
  const found = values.find(
    (value) => typeof value === "string" && value.trim() !== ""
  );
  return found ? found.trim() : "";
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

function normalizeImageItem(item) {
  if (typeof item === "string") {
    return isHttpUrl(item)
      ? {url: item, linkUrl: item, title: "", alt: "연관 이미지"}
      : null;
  }

  if (!item || typeof item !== "object") return null;

  const url = firstText(
    item.url,
    item.src,
    item.imageUrl,
    item.image_url,
    item.thumbnail,
    item.thumbnailUrl
  );
  if (!isHttpUrl(url)) return null;

  const linkUrl = firstText(item.link, item.href, item.sourceUrl, item.pageUrl);
  const title = firstText(item.title, item.name, item.caption, item.alt);

  return {
    url,
    linkUrl: isHttpUrl(linkUrl) ? linkUrl : url,
    title,
    alt: firstText(item.alt, title, "연관 이미지"),
  };
}

const normalizedItems = computed(() =>
  props.items.map(normalizeImageItem).filter(Boolean)
);
</script>

<style scoped lang="scss">
.assistant-rag-images {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid var(--control-border);
  border-radius: 16px;
  background: var(--control-bg);
}

.assistant-rag-images__title {
  margin-bottom: 8px;
  color: var(--text-muted);
  font-size: var(--font-size-fixed-12);
  font-weight: 800;
}

.assistant-rag-images__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
  gap: 10px;
}

.assistant-rag-images__card {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--message-border);
  border-radius: 14px;
  color: var(--text);
  text-decoration: none;
  background: var(--surface);
}

.assistant-rag-images__card:hover {
  border-color: var(--control-border);
  background: var(--control-hover);
}

.assistant-rag-images__image {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: var(--control-hover);
  -webkit-user-drag: none;
  user-select: none;
}

.assistant-rag-images__caption {
  display: block;
  min-width: 0;
  overflow: hidden;
  padding: 8px 9px;
  color: var(--text-muted);
  font-size: var(--font-size-fixed-12);
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

body.mobile-mode .assistant-rag-images {
  margin-top: 12px;
  padding: 10px;
  border-radius: 14px;
}

body.mobile-mode .assistant-rag-images__grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
</style>
