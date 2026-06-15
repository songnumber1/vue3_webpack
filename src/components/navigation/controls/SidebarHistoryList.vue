<template>
  <component
    :is="scrollContainerComponent"
    :class="[containerClass, 'tw-min-w-0']"
    v-bind="scrollContainerAttrs"
    @scroll.passive.capture="hideTooltip"
    @wheel.passive.capture="hideTooltip"
    @pointerdown.capture="hideTooltip"
    @mouseleave="hideTooltip"
  >
    <div
      v-for="item in histories"
      :key="item.id"
      class="sidebar-history-row tw-group tw-flex tw-w-full tw-items-center tw-gap-1"
      :class="{selected: String(item.id) === String(selectedChatId)}"
      @mouseleave="hideTooltip"
    >
      <button
        :class="[
          itemClass,
          'sidebar-history-title-button tw-min-w-0 tw-flex-1 tw-rounded-control tw-text-left tw-transition',
        ]"
        type="button"
        :aria-label="item.title"
        @mouseenter="showTooltip($event, item)"
        @focus="showTooltip($event, item)"
        @blur="hideTooltip"
        @click="handleSelect(item)"
      >
        <span>{{ item.title }}</span>
      </button>

      <div
        v-if="showActions"
        class="sidebar-history-actions tw-flex tw-shrink-0 tw-items-center tw-gap-1"
      >
        <span
          v-if="item.isPinned"
          class="sidebar-history-pin tw-inline-flex tw-items-center tw-justify-center tw-rounded-controlSm"
          :aria-label="t('chat.historyMenu.pin')"
        >
          📌
        </span>
        <button
          v-if="showMenu"
          class="sidebar-history-menu-button tw-inline-flex tw-items-center tw-justify-center tw-rounded-controlSm"
          type="button"
          :aria-label="t('chat.historyMenu.title')"
          @mouseenter="hideTooltip"
          @focus="hideTooltip"
          @click.stop="handleOpenMenu(item, $event)"
        >
          ⋯
        </button>
      </div>
    </div>
  </component>

  <teleport to="body">
    <div
      v-if="isTooltipEnabled && activeTooltipTitle"
      ref="tooltipRef"
      class="sidebar-history-tooltip"
      :style="tooltipStyle"
      role="tooltip"
    >
      {{ activeTooltipTitle }}
    </div>
  </teleport>
</template>

<script setup>
/**
 * @file components/navigation/controls/SidebarHistoryList.vue
 * @description 좌측 메뉴/드로어 관련 UI입니다. navigation store 상태와 사용자 메뉴 action을 화면에 연결합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, nextTick, ref, watch} from "vue";
import {autoUpdate, flip, offset, shift, useFloating} from "@floating-ui/vue";
import {useResponsiveContext} from "@/composables/app/responsiveContext";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";
import {OverlayScrollbarsComponent} from "overlayscrollbars-vue";
import "overlayscrollbars/overlayscrollbars.css";
import {useI18n} from "vue-i18n";

const {t} = useI18n();
const responsiveContext = useResponsiveContext();
const {
  isActualAndroidRuntime,
  shouldUseOverlayScrollbar: shouldUseOverlayScrollbarByPolicy,
} = useOverlayScrollPolicy();

const props = defineProps({
  histories: {type: Array, default: () => []},
  selectedChatId: {type: [String, Number], default: ""},
  containerClass: {
    type: String,
    default: "sidebar-history sidebar-history--main",
  },
  itemClass: {type: String, default: "sidebar-history-item"},
  useOverlayScrollbar: {type: Boolean, default: false},
  showActions: {type: Boolean, default: true},
  showMenu: {type: Boolean, default: true},
  tooltipPlacement: {type: String, default: "right-start"},
});

const emit = defineEmits(["select", "open-menu"]);

const overlayScrollbarOptions = {
  overflow: {x: "hidden", y: "scroll"},
  scrollbars: {
    theme: "os-theme-chat-app",
    autoHide: "leave",
    autoHideDelay: 450,
  },
};

const tooltipRef = ref(null);
const tooltipReferenceRef = ref(null);
const activeTooltipTitle = ref("");

const isDesktopViewport = computed(() =>
  Boolean(
    responsiveContext.value?.isDesktop && !responsiveContext.value?.isMobile
  )
);

const isTooltipEnabled = computed(
  () => isDesktopViewport.value && !isActualAndroidRuntime.value
);

const {floatingStyles, update} = useFloating(tooltipReferenceRef, tooltipRef, {
  placement: computed(() => props.tooltipPlacement),
  strategy: "fixed",
  transform: false,
  whileElementsMounted: autoUpdate,
  middleware: [
    offset(8),
    flip({
      fallbackPlacements: [
        "left-start",
        "right",
        "left",
        "bottom-start",
        "top-start",
      ],
    }),
    shift({padding: 8}),
  ],
});

const tooltipStyle = computed(() => ({
  ...floatingStyles.value,
  position: "fixed",
  pointerEvents: "none",
}));

function hasTextOverflow(targetEl) {
  const textEl = targetEl?.querySelector?.("span");
  if (!textEl) return false;
  return textEl.scrollWidth > textEl.clientWidth + 1;
}

async function showTooltip(event, item) {
  if (!isTooltipEnabled.value) {
    hideTooltip();
    return;
  }

  const targetEl = event.currentTarget;
  if (!hasTextOverflow(targetEl)) {
    hideTooltip();
    return;
  }

  tooltipReferenceRef.value = targetEl;
  activeTooltipTitle.value = item?.title || "";

  await nextTick();
  await update?.();
}

function hideTooltip() {
  activeTooltipTitle.value = "";
  tooltipReferenceRef.value = null;
}

function handleSelect(item) {
  hideTooltip();
  emit("select", item);
}

function handleOpenMenu(item, event) {
  hideTooltip();
  emit("open-menu", {item, event});
}

const overlayScrollbarEvents = {
  scroll: hideTooltip,
  updated: hideTooltip,
};

const shouldUseOverlayScrollbar = computed(
  () => props.useOverlayScrollbar && shouldUseOverlayScrollbarByPolicy.value
);

const scrollContainerComponent = computed(() =>
  shouldUseOverlayScrollbar.value ? OverlayScrollbarsComponent : "div"
);

const scrollContainerAttrs = computed(() =>
  shouldUseOverlayScrollbar.value
    ? {
        defer: true,
        options: overlayScrollbarOptions,
        events: overlayScrollbarEvents,
      }
    : {}
);

watch(isTooltipEnabled, (enabled) => {
  if (!enabled) hideTooltip();
});

watch(
  () => props.histories,
  () => hideTooltip()
);
</script>
