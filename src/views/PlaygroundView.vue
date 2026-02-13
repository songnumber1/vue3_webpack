<template>
  <div class="playground">
    <!-- Header -->
    <div class="pg-head">
      <div class="pg-title">Playground</div>

      <div class="pg-meta">
        <span class="pg-pill">
          width: <b>{{ width }}</b>px
        </span>
        <span class="pg-pill">
          breakpoint: <b>{{ bpLabel }}</b>
        </span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="pg-tabs">
      <button v-for="t in tabs" :key="t.key" class="pg-tab" :class="{ active: activeTab === t.key }"
        @click="activeTab = t.key">
        {{ t.label }}
      </button>
    </div>

    <!-- Tab Panels -->
    <div class="pg-panel">
      <component v-if="activeTabComponent" :is="activeTabComponent" />
    </div>
  </div>
</template>

<script>
import { markRaw } from "vue";
import PlaygroudData from "@/components/sample/PlayGroudData.vue";
import PlaygroundNavigator from "@/components/sample/PlaygroundNavigator.vue";
import PlaygroundTheme from "@/components/sample/PlaygroundTheme.vue";
import PlaygroudModal from "@/components/sample/PlaygroudModal.vue";
import PlaygroudStorage from "@/components/sample/PlaygroudStorage.vue";
import PlaygroundNote from "@/components/sample/PlaygroundNote.vue";
import PlaygroundLayoutTab from "@/components/sample/PlaygroundLayoutTab.vue";
import PlaygroundSearchSnippet from "@/components/sample/PlaygroundSearchSnippet.vue";

export default {
  name: "PlaygroundView",
  data() {
    return {
      activeTab: "data",
      demoSwitch: true,
      tabs: [
        { key: "data", label: "Data", component: markRaw(PlaygroudData), },
        {
          key: "navigators",
          label: "Navigators",
          component: PlaygroundNavigator,
        },
        { key: "theme", label: "Theme", component: markRaw(PlaygroundTheme) },
        { key: "modal", label: "Modal", component: markRaw(PlaygroudModal) },
        { key: "storage", label: "Storage", component: markRaw(PlaygroudStorage) },
        { key: "Note", label: "Note", component: markRaw(PlaygroundNote) },
        { key: "Layout", label: "Layout", component: markRaw(PlaygroundLayoutTab) },
        { key: "SearchSnippet", label: "SearchSnippet", component: markRaw(PlaygroundSearchSnippet) },

      ],
      rows: [
        {
          id: 1,
          title: "Row Item 1",
          desc: "설명 텍스트",
          status: "OK",
          badgeClass: "badge-success",
        },
        {
          id: 2,
          title: "Row Item 2",
          desc: "설명 텍스트",
          status: "WARN",
          badgeClass: "badge-warn",
        },
        {
          id: 3,
          title: "Row Item 3",
          desc: "설명 텍스트",
          status: "FAIL",
          badgeClass: "badge-danger",
        },
      ],
    };
  },
  computed: {
    activeTabComponent() {
      return this.tabs.find((tab) => tab.key === this.activeTab)?.component;
    },
    width() {
      return (
        this.$responsive?.width ??
        (typeof window !== "undefined" ? window.innerWidth : 1200)
      );
    },
    cols() {
      // 🔴 이 부분이 빠져 있어서 경고 발생
      if (this.bpLabel === "sm") return 1;
      if (this.bpLabel === "md") return 2;
      return 3;
    },
    bpLabel() {
      return this.$responsive?.bp || "lg";
    },
  },

  methods: {},
};
</script>
