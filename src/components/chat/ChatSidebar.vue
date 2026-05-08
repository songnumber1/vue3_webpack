<template>
  <aside class="desktop-sidebar" :class="{'desktop-sidebar--collapsed': sidebarCollapsed}">
      <div v-if="!sidebarCollapsed" class="sidebar-content">
        <div class="sidebar-top">
          <div class="sidebar-title">ChatGPT</div>
          <div class="sidebar-top-actions">
            <button
              class="sidebar-round"
              type="button"
              title="사이드바 숨기기"
              aria-label="사이드바 숨기기"
              @click="emitSidebarCollapsed(true)"
            >
              ☰
            </button>
          </div>
        </div>

        <nav class="quick-menu">
          <button class="quick-item active" type="button" @click="$emit('new-chat')">
            <Icon name="pencil" />
            새 채팅
          </button>
          <button class="quick-item" type="button">
            <Icon name="search" />
            채팅 검색
          </button>
          <button class="quick-item" type="button">
            <Icon name="cube" />
            Codex
          </button>
          <button class="quick-item" type="button">
            <Icon name="more" />
            더 보기
          </button>
        </nav>

        <div class="section-label">프로젝트</div>
        <div class="project-list">
          <button class="project-item new-project" type="button">
            <Icon name="plus" />
            새 프로젝트
          </button>
          <button
            v-for="project in projects"
            :key="project.id"
            class="project-item"
            :class="{selected: project.id === activeProjectId}"
            type="button"
          >
            <Icon name="folder" />
            {{ project.name }}
          </button>
          <button class="project-item" type="button">
            <Icon name="more" />
            모든 프로젝트
          </button>
        </div>

        <div class="section-label">최근</div>
        <div class="sidebar-history">
          <button
            v-for="item in histories"
            :key="item.id"
            class="sidebar-history-item"
            type="button"
            @click="$emit('select-history', item)"
          >
            {{ item.title }}
          </button>
        </div>

        <div class="sidebar-user">
          <div class="user-avatar">민</div>
          <div>
            <strong>민우 송</strong>
            <small>Plus</small>
          </div>
        </div>
      </div>

      <div v-else class="collapsed-sidebar" aria-label="접힌 사이드바">
        <div class="collapsed-sidebar-actions">
          <button
            class="collapsed-icon-button"
            type="button"
            title="사이드바 열기"
            aria-label="사이드바 열기"
            @click="emitSidebarCollapsed(false)"
          >
            <Icon name="panel" bare />
          </button>
          <button
            class="collapsed-icon-button"
            type="button"
            title="새 채팅"
            aria-label="새 채팅"
            @click="$emit('new-chat')"
          >
            <Icon name="pencil" bare />
          </button>
          <button
            class="collapsed-icon-button"
            type="button"
            title="채팅 검색"
            aria-label="채팅 검색"
            @click="emitCollapsedRecentOpen(false)"
          >
            <Icon name="search" bare />
          </button>
          <button
            class="collapsed-icon-button collapsed-icon-button--active"
            type="button"
            title="최근 채팅"
            aria-label="최근 채팅"
            @click="emitCollapsedRecentOpen(!collapsedRecentOpen)"
          >
            <Icon name="chat" bare />
          </button>
        </div>

        <transition name="collapsed-popover-fade">
          <section v-if="collapsedRecentOpen" class="collapsed-recent-popover" aria-label="최근 채팅 목록">
            <h2>최근 채팅</h2>
            <button
              v-for="item in histories"
              :key="item.id"
              class="collapsed-recent-item"
              type="button"
              @click="$emit('select-history-collapsed', item)"
            >
              {{ item.title }}
            </button>
          </section>
        </transition>

        <button
          class="collapsed-user-button"
          type="button"
          title="사용자"
          aria-label="사용자"
          @click="emitCollapsedRecentOpen(false)"
        >
          민
        </button>
      </div>
    </aside>

    <transition name="drawer-fade">
      <div
        v-if="drawerOpen"
        class="mobile-drawer-backdrop"
        @click="emitDrawerOpen(false)"
      ></div>
    </transition>

    <transition name="drawer-slide">
      <aside v-if="drawerOpen" class="mobile-drawer">
        <div class="sidebar-content sidebar-content--mobile">
          <div class="sidebar-top">
            <div class="sidebar-title">ChatGPT</div>
            <div class="sidebar-top-actions">
              <button
                class="sidebar-round"
                type="button"
                title="닫기"
                aria-label="닫기"
                @click="emitDrawerOpen(false)"
              >
                ×
              </button>
            </div>
          </div>

          <nav class="quick-menu">
            <button class="quick-item active" type="button" @click="$emit('new-chat')">
              <Icon name="pencil" />
              새 채팅
            </button>
            <button class="quick-item" type="button">
              <Icon name="search" />
              채팅 검색
            </button>
            <button class="quick-item" type="button">
              <Icon name="cube" />
              Codex
            </button>
            <button class="quick-item" type="button">
              <Icon name="more" />
              더 보기
            </button>
          </nav>

          <div class="section-label">프로젝트</div>
          <div class="project-list">
            <button class="project-item new-project" type="button">
              <Icon name="plus" />
              새 프로젝트
            </button>
            <button
              v-for="project in projects"
              :key="project.id"
              class="project-item"
              :class="{selected: project.id === activeProjectId}"
              type="button"
            >
              <Icon name="folder" />
              {{ project.name }}
            </button>
            <button class="project-item" type="button">
              <Icon name="more" />
              모든 프로젝트
            </button>
          </div>

          <div class="section-label">최근</div>
          <div class="sidebar-history">
            <button
              v-for="item in histories"
              :key="item.id"
              class="sidebar-history-item"
              type="button"
              @click="$emit('select-history', item)"
            >
              {{ item.title }}
            </button>
          </div>

          <button class="mobile-new-chat-fab" type="button" @click="$emit('new-chat')">
            <Icon name="pencil" />
            채팅
          </button>

          <div class="sidebar-user">
            <div class="user-avatar">민</div>
            <div>
              <strong>민우 송</strong>
              <small>Plus</small>
            </div>
          </div>
        </div>
      </aside>
    </transition>
</template>

<script setup>
import {defineComponent, h} from "vue";

const props = defineProps({
  histories: {type: Array, required: true},
  projects: {type: Array, required: true},
  activeProjectId: {type: Number, required: true},
  sidebarCollapsed: {type: Boolean, required: true},
  drawerOpen: {type: Boolean, required: true},
  collapsedRecentOpen: {type: Boolean, required: true},
});

const emit = defineEmits([
  "update:sidebarCollapsed",
  "update:drawerOpen",
  "update:collapsedRecentOpen",
  "new-chat",
  "select-history",
  "select-history-collapsed",
]);

const ICONS = {
  pencil: '<path d="M4 16.5V20h3.5L18.1 9.4 14.6 5.9 4 16.5Z"/><path d="M13.4 7.1 16.9 10.6"/>',
  search: '<circle cx="10.5" cy="10.5" r="5.8"/><path d="M15 15 20 20"/>',
  cube: '<path d="M12 3 4.5 7.2v9.6L12 21l7.5-4.2V7.2L12 3Z"/><path d="m4.8 7.4 7.2 4.1 7.2-4.1"/><path d="M12 11.5V21"/>',
  more: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  folder: '<path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4.1l2.1 2.4H18a2.5 2.5 0 0 1 2.5 2.5v6.6A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9Z"/>',
  panel: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 4v16"/>',
  chat: '<path d="M5 6.8A4 4 0 0 1 9 3h6a4 4 0 0 1 4 4v4.3a4 4 0 0 1-4 4H9.3L5 20v-4.7a4 4 0 0 1-1-2.7V6.8Z"/>',
  project: '<path d="M5 7.5h14l-2 9H3l2-9Z"/>',
};

const Icon = defineComponent({
  name: "ChatSidebarIcon",
  props: {
    name: {type: String, required: true},
    bare: {type: Boolean, default: false},
  },
  setup(iconProps) {
    return () => {
      const svg = h("svg", {
        class: "nav-icon",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        innerHTML: ICONS[iconProps.name] || ICONS.project,
        "aria-hidden": "true",
      });

      if (iconProps.bare) return svg;
      return h("span", {class: "icon-wrap"}, [svg]);
    };
  },
});

function emitSidebarCollapsed(value) {
  emit("update:sidebarCollapsed", value);
}

function emitDrawerOpen(value) {
  emit("update:drawerOpen", value);
}

function emitCollapsedRecentOpen(value) {
  emit("update:collapsedRecentOpen", value);
}
</script>
