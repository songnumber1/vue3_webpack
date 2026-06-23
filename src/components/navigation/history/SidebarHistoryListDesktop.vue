<template>
  <OverlayScrollbarsComponent
    v-if="shouldUseOverlayScrollbar"
    :class="[containerClass, 'tw-min-w-0']"
    defer
    :options="overlayScrollbarOptions"
    :events="overlayScrollbarEvents"
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
  </OverlayScrollbarsComponent>

  <div
    v-else
    :class="[containerClass, 'tw-min-w-0']"
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
  </div>

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
 * @file components/navigation/history/SidebarHistoryListDesktop.vue
 * @description PC 좌측 이력 리스트입니다. OverlayScrollbars와 hover tooltip을 직접 관리합니다.
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

watch(isTooltipEnabled, (enabled) => {
  if (!enabled) hideTooltip();
});

watch(
  () => props.histories,
  () => hideTooltip()
);
</script>
