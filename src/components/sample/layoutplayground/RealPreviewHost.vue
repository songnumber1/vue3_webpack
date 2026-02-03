
<template>
  <div ref="mountEl" class="host"></div>
</template>

<script>
import { createApp, h, defineComponent } from "vue";
import { createPinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";

import responsiveManager from "@/plugins/responsiveManager";
import themeManager from "@/plugins/themeManager";

import { seedPreviewStores, enablePreviewBridge } from "@/stores/previewSeed";

// ✅ runtime-only build safe stubs (render functions, no template strings)
const Stub = defineComponent({
  name: "PreviewStub",
  render() {
    return h("div");
  },
});

export default {
  name: "RealPreviewHost",
  props: {
    previewComponent: { type: Object, required: true },
    mode: { type: String, default: "block" },
  },
  data() {
    return { app: null, offBridge: null };
  },
  mounted() {
    this.mount();
  },
  beforeUnmount() {
    this.unmount();
  },
  watch: {
    previewComponent() {
      this.unmount();
      this.mount();
    },
  },
  methods: {
    mount() {
      const PreviewRoot = defineComponent({
        name: "PreviewRoot",
        render: () =>
          h(
            "div",
            { class: this.mode === "layout" ? "preview-layout" : "preview-block" },
            [h(this.previewComponent)]
          ),
      });

      const app = createApp(PreviewRoot);

      const pinia = createPinia();
      app.use(pinia);

      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: "/", name: "home", component: Stub },
          { path: "/main", name: "main", component: Stub },
          { path: "/chat/:id", name: "chat", component: Stub },
          { path: "/playground", name: "playground", component: Stub },
        ],
      });
      app.use(router);

      // ✅ Only real Vue plugins
      app.use(responsiveManager);
      app.use(themeManager);

      router.isReady().then(() => {
        router.push("/main").catch(() => {});
        seedPreviewStores();
        try {
          this.offBridge = enablePreviewBridge();
        } catch (e) {
          // ignore
        }
      });

      app.mount(this.$refs.mountEl);

      this.app = app;
    },
    unmount() {
      if (this.offBridge) {
        try { this.offBridge(); } catch(e) {}
        this.offBridge = null;
      }
      if (this.app) {
        this.app.unmount();
        this.app = null;
        if (this.$refs.mountEl) this.$refs.mountEl.innerHTML = "";
      }
    },
  },
};
</script>

<style scoped>
.host { width: 100%; height: 100%; }
.preview-block { padding: 0; }
.preview-layout { height: 100%; }
</style>
