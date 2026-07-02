<template>
  <OverlayScrollbarsComponent
    v-if="shouldUseOverlayScrollbar"
    :class="[containerClass, 'tw-min-w-0']"
    defer
    :options="overlayScrollbarOptions"
  >
    <div
      v-for="item in histories"
      :key="item.chatId"
      class="sidebar-history-row tw-group tw-flex tw-w-full tw-items-center tw-gap-1"
      :class="{selected: String(item.chatId) === String(selectedChatId)}"
    >
      <button
        :class="[
          itemClass,
          'sidebar-history-title-button tw-min-w-0 tw-flex-1 tw-rounded-control tw-text-left tw-transition',
        ]"
        type="button"
        :aria-label="item.title"
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
          @click.stop="handleOpenMenu(item, $event)"
        >
          ⋯
        </button>
      </div>
    </div>
  </OverlayScrollbarsComponent>

  <div v-else :class="[containerClass, 'tw-min-w-0']">
    <div
      v-for="item in histories"
      :key="item.chatId"
      class="sidebar-history-row tw-group tw-flex tw-w-full tw-items-center tw-gap-1"
      :class="{selected: String(item.chatId) === String(selectedChatId)}"
    >
      <button
        :class="[
          itemClass,
          'sidebar-history-title-button tw-min-w-0 tw-flex-1 tw-rounded-control tw-text-left tw-transition',
        ]"
        type="button"
        :aria-label="item.title"
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
          @click.stop="handleOpenMenu(item, $event)"
        >
          ⋯
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * @file components/navigation/history/SidebarHistoryListMobile.vue
 * @description 모바일 드로어용 이력 리스트입니다. tooltip 없이 선택과 액션만 직접 처리합니다.
 */

import {computed} from "vue";
import {OverlayScrollbarsComponent} from "overlayscrollbars-vue";
import "overlayscrollbars/overlayscrollbars.css";
import {useI18n} from "vue-i18n";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";

const {t} = useI18n();
const {shouldUseOverlayScrollbar: shouldUseOverlayScrollbarByPolicy} =
  useOverlayScrollPolicy();

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

const emit = defineEmits(["select", "open-menu"]);

const overlayScrollbarOptions = {
  overflow: {x: "hidden", y: "scroll"},
  scrollbars: {
    theme: "os-theme-chat-app",
    autoHide: "leave",
    autoHideDelay: 450,
  },
};

const shouldUseOverlayScrollbar = computed(
  () => props.useOverlayScrollbar && shouldUseOverlayScrollbarByPolicy.value
);

function handleSelect(item) {
  emit("select", item);
}

function handleOpenMenu(item, event) {
  emit("open-menu", {item, event});
}
</script>
