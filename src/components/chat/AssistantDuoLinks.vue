<template>
  <section v-if="normalizedItems.length" class="assistant-duo-links">
    <div class="assistant-duo-links__title">연관 링크</div>
    <ul class="assistant-duo-links__list" aria-label="연관 링크 목록">
      <li
        v-for="(item, index) in normalizedItems"
        :key="`${item.url}-${index}`"
        class="assistant-duo-links__item"
      >
        <a
          class="assistant-duo-links__link"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="assistant-duo-links__label">{{ item.title }}</span>
          <span
            v-if="item.description"
            class="assistant-duo-links__description"
          >
            {{ item.description }}
          </span>
          <span class="assistant-duo-links__url">{{ item.displayUrl }}</span>
        </a>
      </li>
    </ul>
  </section>
</template>

<script setup>
/**
 * @file components/chat/AssistantDuoLinks.vue
 * @description 답변 하단에 API/mock duo 배열로 전달되는 연관 링크 목록을 표시합니다.
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

function toDisplayUrl(value) {
  try {
    const url = new URL(value);
    return url.hostname.replace(/^www\./i, "");
  } catch {
    return value;
  }
}

function normalizeDuoItem(item) {
  if (typeof item === "string") {
    return isHttpUrl(item)
      ? {
          title: item,
          description: "",
          url: item,
          displayUrl: toDisplayUrl(item),
        }
      : null;
  }

  if (!item || typeof item !== "object") return null;

  const url = firstText(item.url, item.link, item.href, item.sourceUrl);
  if (!isHttpUrl(url)) return null;

  const title = firstText(item.title, item.name, item.label, item.text, url);
  const description = firstText(item.description, item.summary, item.desc);

  return {
    title,
    description,
    url,
    displayUrl: toDisplayUrl(url),
  };
}

const normalizedItems = computed(() =>
  props.items.map(normalizeDuoItem).filter(Boolean)
);
</script>

<style scoped lang="scss">
.assistant-duo-links {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid var(--control-border);
  border-radius: 16px;
  background: var(--control-bg);
}

.assistant-duo-links__title {
  margin-bottom: 8px;
  color: var(--text-muted);
  font-size: var(--font-size-fixed-12);
  font-weight: 800;
}

.assistant-duo-links__list {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.assistant-duo-links__link {
  display: grid;
  gap: 3px;
  min-width: 0;
  padding: 10px 11px;
  border: 1px solid var(--message-border);
  border-radius: 12px;
  color: var(--text);
  text-decoration: none;
  background: var(--surface);
}

.assistant-duo-links__link:hover {
  border-color: var(--control-border);
  background: var(--control-hover);
}

.assistant-duo-links__label,
.assistant-duo-links__description,
.assistant-duo-links__url {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.assistant-duo-links__label {
  white-space: nowrap;
  font-size: var(--font-size-fixed-13);
  font-weight: 800;
}

.assistant-duo-links__description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  color: var(--text-muted);
  font-size: var(--font-size-fixed-12);
  line-height: 1.45;
}

.assistant-duo-links__url {
  white-space: nowrap;
  color: var(--text-muted);
  font-size: var(--font-size-fixed-11);
}

body.mobile-mode .assistant-duo-links {
  margin-top: 12px;
  padding: 10px;
  border-radius: 14px;
}
</style>
