<template>
  <component
    :is="scrollContainerComponent"
    :class="[containerClass, 'tw-min-w-0']"
    v-bind="scrollContainerAttrs"
  >
    <div
      v-for="item in histories"
      :key="item.id"
      class="sidebar-history-row tw-group tw-flex tw-w-full tw-items-center tw-gap-1"
      :class="{selected: String(item.id) === String(selectedChatId)}"
    >
      <button
        :class="[
          itemClass,
          'sidebar-history-title-button tw-min-w-0 tw-flex-1 tw-rounded-control tw-text-left tw-transition',
        ]"
        type="button"
        :title="item.title"
        @click="$emit('select', item)"
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
          :title="t('chat.historyMenu.pin')"
        >
          📌
        </span>
        <button
          v-if="showMenu"
          class="sidebar-history-menu-button tw-inline-flex tw-items-center tw-justify-center tw-rounded-controlSm"
          type="button"
          :aria-label="t('chat.historyMenu.title')"
          :title="t('chat.historyMenu.title')"
          @click.stop="$emit('open-menu', {item, event: $event})"
        >
          ⋯
        </button>
      </div>
    </div>
  </component>
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

import {computed} from "vue";
import {usePlatformStore} from "@/stores/platformStore";
import {OverlayScrollbarsComponent} from "overlayscrollbars-vue";
import "overlayscrollbars/overlayscrollbars.css";
import {useI18n} from "vue-i18n";

const {t} = useI18n();
const platformStore = usePlatformStore();

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
});

defineEmits(["select", "open-menu"]);

const overlayScrollbarOptions = {
  overflow: {x: "hidden", y: "scroll"},
  scrollbars: {
    theme: "os-theme-chat-app",
    autoHide: "leave",
    autoHideDelay: 450,
  },
};

const isActualAndroidRuntime = computed(() => {
  const info = platformStore.info || {};
  const userAgent = String(info.userAgent || "");
  return Boolean(
    info.actualEnv === "android" ||
    info.actualDevice === "android" ||
    info.actualDevice === "android-webview" ||
    info.actualBrowser === "android-webview" ||
    info.isAndroidApp ||
    /Android/i.test(userAgent)
  );
});

const shouldUseOverlayScrollbar = computed(
  () => props.useOverlayScrollbar && !isActualAndroidRuntime.value
);

const scrollContainerComponent = computed(() =>
  shouldUseOverlayScrollbar.value ? OverlayScrollbarsComponent : "div"
);

const scrollContainerAttrs = computed(() =>
  shouldUseOverlayScrollbar.value
    ? {
        defer: true,
        options: overlayScrollbarOptions,
      }
    : {}
);
</script>
