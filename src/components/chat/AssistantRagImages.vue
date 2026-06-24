<template>
  <section v-if="normalizedItems.length" class="assistant-rag-images">
    <div class="assistant-rag-images__title">연관 이미지</div>

    <div class="assistant-rag-images__viewport">
      <button
        v-if="canOverflow"
        type="button"
        class="assistant-rag-images__nav assistant-rag-images__nav--prev"
        :class="{'is-disabled': !canScrollPrev}"
        :disabled="!canScrollPrev"
        aria-label="이전 연관 이미지 보기"
        @click="scrollImages('prev')"
      >
        ‹
      </button>

      <div
        ref="scrollerRef"
        class="assistant-rag-images__scroller"
        :class="{'has-overflow': canOverflow}"
        aria-label="연관 이미지 목록"
        @scroll.passive="updateScrollState"
      >
        <div ref="trackRef" class="assistant-rag-images__track">
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
              @load="scheduleScrollStateUpdate"
              @error="scheduleScrollStateUpdate"
            />
            <span v-if="item.title" class="assistant-rag-images__caption">
              {{ item.title }}
            </span>
          </a>
        </div>
      </div>

      <button
        v-if="canOverflow"
        type="button"
        class="assistant-rag-images__nav assistant-rag-images__nav--next"
        :class="{'is-disabled': !canScrollNext}"
        :disabled="!canScrollNext"
        aria-label="다음 연관 이미지 보기"
        @click="scrollImages('next')"
      >
        ›
      </button>
    </div>
  </section>
</template>

<script setup>
/**
 * @file components/chat/AssistantRagImages.vue
 * @description 답변 하단에 API/mock ragimage 배열로 전달되는 연관 이미지 목록을 한 줄 가로 리스트로 표시합니다.
 */

import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {useOverlayScrollbar} from "@/composables/ui/useOverlayScrollbar";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";

const props = defineProps({
  items: {type: Array, default: () => []},
});

const scrollerRef = ref(null);
const trackRef = ref(null);
const canOverflow = ref(false);
const canScrollPrev = ref(false);
const canScrollNext = ref(false);
const {shouldUseOverlayScrollbar} = useOverlayScrollPolicy();

let removeViewportScrollListener = null;
let removeWindowResizeListener = null;
let resizeObserver = null;

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

const overlayScroller = useOverlayScrollbar(
  scrollerRef,
  {
    overflow: {x: "scroll", y: "hidden"},
    scrollbars: {
      autoHide: "leave",
      autoHideDelay: 350,
      clickScroll: true,
    },
  },
  {
    enabled: () => shouldUseOverlayScrollbar.value,
    reserveScrollbarGap: false,
    watchSource: () => normalizedItems.value.length,
  }
);

function getScrollElement() {
  return overlayScroller.getViewport?.() || scrollerRef.value;
}

function updateScrollState() {
  const element = getScrollElement();
  if (!element) {
    canOverflow.value = false;
    canScrollPrev.value = false;
    canScrollNext.value = false;
    return;
  }

  const maxLeft = Math.max(0, element.scrollWidth - element.clientWidth);
  const currentLeft = Math.max(0, element.scrollLeft || 0);
  const overflowNow = maxLeft > 2;

  canOverflow.value = overflowNow;
  canScrollPrev.value = overflowNow && currentLeft > 1;
  canScrollNext.value = overflowNow && currentLeft < maxLeft - 1;
}

async function scheduleScrollStateUpdate() {
  await nextTick();
  overlayScroller.update?.();

  if (typeof window === "undefined") {
    updateScrollState();
    return;
  }

  window.requestAnimationFrame(() => {
    overlayScroller.update?.();
    updateScrollState();
  });
}

function scrollImages(direction) {
  const element = getScrollElement();
  if (!element || !canOverflow.value) return;

  const distance = Math.max(180, Math.floor(element.clientWidth * 0.75));
  element.scrollBy({
    left: direction === "next" ? distance : -distance,
    behavior: "smooth",
  });

  if (typeof window !== "undefined") {
    window.setTimeout(updateScrollState, 240);
  }
}

async function bindOverlayViewportScroll() {
  await nextTick();
  removeViewportScrollListener?.();
  removeViewportScrollListener = null;

  const viewport = getScrollElement();
  if (!viewport || viewport === scrollerRef.value) return;

  viewport.addEventListener("scroll", updateScrollState, {passive: true});
  removeViewportScrollListener = () => {
    viewport.removeEventListener("scroll", updateScrollState);
  };
}

function bindResizeObserver() {
  if (typeof ResizeObserver === "undefined") return;

  resizeObserver?.disconnect?.();
  resizeObserver = new ResizeObserver(() => scheduleScrollStateUpdate());

  if (scrollerRef.value) resizeObserver.observe(scrollerRef.value);
  if (trackRef.value) resizeObserver.observe(trackRef.value);
}

onMounted(async () => {
  await scheduleScrollStateUpdate();
  await bindOverlayViewportScroll();
  bindResizeObserver();

  if (typeof window !== "undefined") {
    const handleResize = () => scheduleScrollStateUpdate();
    window.addEventListener("resize", handleResize, {passive: true});
    removeWindowResizeListener = () =>
      window.removeEventListener("resize", handleResize);
  }
});

onBeforeUnmount(() => {
  removeViewportScrollListener?.();
  removeWindowResizeListener?.();
  resizeObserver?.disconnect?.();
});

watch(
  () => [normalizedItems.value.length, shouldUseOverlayScrollbar.value],
  async () => {
    await scheduleScrollStateUpdate();
    await bindOverlayViewportScroll();
    bindResizeObserver();
  },
  {flush: "post"}
);
</script>

<style scoped lang="scss">
.assistant-rag-images {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  margin-top: 14px;
  padding: 12px;
  overflow: hidden;
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

.assistant-rag-images__viewport {
  position: relative;
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.assistant-rag-images__scroller {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.assistant-rag-images__track {
  display: inline-flex;
  flex-flow: row nowrap;
  align-items: stretch;
  width: max-content;
  min-width: max-content;
  max-width: none;
  gap: 10px;
  padding: 0 1px 4px;
}

.assistant-rag-images__card {
  flex: 0 0 132px;
  width: 132px;
  min-width: 132px;
  max-width: 132px;
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

.assistant-rag-images__nav {
  position: absolute;
  top: 50%;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 42px;
  border: 1px solid var(--control-border);
  border-radius: 999px;
  color: var(--text);
  font-size: 27px;
  font-weight: 800;
  line-height: 1;
  background: var(--surface);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.24);
  transform: translateY(-50%);
}

.assistant-rag-images__nav--prev {
  left: 6px;
}

.assistant-rag-images__nav--next {
  right: 6px;
}

.assistant-rag-images__nav:not(.is-disabled):hover {
  background: var(--control-hover);
}

.assistant-rag-images__nav:not(.is-disabled):active {
  transform: translateY(-50%) scale(0.96);
}

.assistant-rag-images__nav.is-disabled {
  cursor: default;
  opacity: 0.35;
}

@media (max-width: 768px) {
  .assistant-rag-images {
    margin-top: 12px;
    padding: 10px;
    border-radius: 14px;
  }

  .assistant-rag-images__track {
    gap: 8px;
  }

  .assistant-rag-images__card {
    flex-basis: 124px;
    width: 124px;
    min-width: 124px;
    max-width: 124px;
    border-radius: 13px;
  }

  .assistant-rag-images__nav {
    width: 32px;
    height: 40px;
    font-size: 26px;
  }

  .assistant-rag-images__nav--prev {
    left: 4px;
  }

  .assistant-rag-images__nav--next {
    right: 4px;
  }
}
</style>
