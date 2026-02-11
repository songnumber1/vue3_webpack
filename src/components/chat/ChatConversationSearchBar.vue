<template>
  <div v-if="open" class="chat-searchbar" @keydown.esc.prevent="close">
    <div class="row">
      <input
        ref="input"
        class="q"
        type="text"
        :value="keyword"
        placeholder="Search in chat..."
        @input="onInput"
        @keydown.enter.prevent="onEnter"
      />

      <button
        type="button"
        class="btn"
        :class="{ on: highlightOn }"
        title="Toggle highlight"
        @click="toggleHighlight"
      >
        <span class="icon">
          <AppIcon name="search" size="xl" :muted="!highlightOn" />
        </span>
      </button>

      <div class="count" :class="{ disabled: total === 0 }">
        {{ total ? current + " / " + total : "0 / 0" }}
      </div>

      <button
        type="button"
        class="btn"
        :disabled="total === 0"
        title="Prev"
        @click="prev"
      >
        <span class="icon">
          <AppIcon name="chevron-left" size="xl" />
        </span>
      </button>
      <button
        type="button"
        class="btn"
        :disabled="total === 0"
        title="Next"
        @click="next"
      >
        <span class="icon">
          <AppIcon name="chevron-right" size="xl" />
        </span>
      </button>

      <button type="button" class="btn" title="Close" @click="close">
        <span class="icon">
          <AppIcon name="x" size="xl" />
        </span>
      </button>
    </div>
  </div>
</template>

<script>
import AppIcon from "@/components/common/AppIcon.vue";
import {
  clearOverlay,
  scanMatchesAsync,
  renderOverlay,
  computeInitialIndex,
  scrollToMatch,
} from "@/utils/chatSearchOverlay";

export default {
  name: "ChatConversationSearchBar",
  components: { AppIcon },

  props: {
    containerEl: { type: Object, default: null },
  },

  data() {
    return {
      open: false,
      keyword: "",
      matches: [],
      activeIndex: 0,
      highlightOn: true,
      _abort: null,
      _raf: 0,
      _anchorMsgId: null,
    };
  },

  computed: {
    total() {
      return this.matches.length;
    },
    current() {
      return this.total ? this.activeIndex + 1 : 0;
    },
  },

  mounted() {
    window.addEventListener("resize", this.onViewportChange, { passive: true });
  },

  beforeUnmount() {
    window.removeEventListener("resize", this.onViewportChange);
    this.cancel();
    this.teardownContainerListener();
    this.clear();
  },

  methods: {
    getContainer() {
      // Prefer injected scroll container (ChatView passes ref),
      // but fall back to known selectors so this remains DI-free.
      return (
        this.containerEl ||
        document.querySelector(".body-contents") ||
        document.querySelector(".messages") ||
        null
      );
    },

    // =====================
    // Public API (parent calls)
    // =====================
    openWith({ anchorMsgId = null, keyword = "" } = {}) {
      this.open = true;
      this._anchorMsgId = anchorMsgId;
      if (keyword != null) this.keyword = String(keyword || "");

      this.$nextTick(() => {
        this.$refs.input?.focus?.();
        this.setupContainerListener();
        this.runSearch();
      });
    },

    close() {
      this.open = false;
      this._anchorMsgId = null;
      this.cancel();
      this.teardownContainerListener();
      this.clear();
    },

    // =====================
    // UI handlers
    // =====================
    onInput(e) {
      this.keyword = String(e?.target?.value ?? "");
      this.runSearch();
    },

    onEnter(e) {
      // Enter => next, Shift+Enter => prev
      if (e?.shiftKey) this.prev();
      else this.next();
    },

    toggleHighlight() {
      this.highlightOn = !this.highlightOn;
      const c = this.getContainer();
      if (!c) return;
      if (!this.highlightOn) {
        clearOverlay(c);
      } else {
        renderOverlay({
          container: c,
          matches: this.matches,
          activeIndex: this.activeIndex,
          highlight: true,
        });
      }
    },

    prev() {
      if (!this.total) return;
      this.activeIndex =
        this.activeIndex <= 0 ? this.total - 1 : this.activeIndex - 1;
      this.jumpToActive();
    },

    next() {
      if (!this.total) return;
      this.activeIndex =
        this.activeIndex >= this.total - 1 ? 0 : this.activeIndex + 1;
      this.jumpToActive();
    },

    // =====================
    // Core search
    // =====================
    cancel() {
      if (this._abort) {
        try {
          this._abort.abort();
        } catch (_) {}
        this._abort = null;
      }
    },

    clear() {
      const c = this.getContainer();
      if (c) clearOverlay(c);
      this.matches = [];
      this.activeIndex = 0;
    },

    getRoots() {
      const c = this.getContainer();
      if (!c) return [];
      // ✅ Restrict to message components only.
      // Some screens use different wrappers; fall back safely.
      const roots = Array.from(c.querySelectorAll('[data-chat-msg-root="1"]'));
      if (roots.length) return roots;

      const byId = Array.from(c.querySelectorAll("[data-chat-msg-id]"));
      if (byId.length) return byId;

      // As a last resort, scan within container (still safe; overlay does not mutate DOM)
      return [c];
    },

    async runSearch() {
      const c = this.getContainer();
      if (!c) return;

      const kw = String(this.keyword || "").trim();
      this.cancel();

      if (!kw) {
        this.clear();
        return;
      }

      const controller = new AbortController();
      this._abort = controller;

      try {
        // Wait for DOM flush + a couple paints to ensure markdown/mermaid DOM
        // has been materialized (important right after API response + render pipeline)
        await this.$nextTick();
        await new Promise((r) => requestAnimationFrame(r));
        await new Promise((r) => requestAnimationFrame(r));

        const roots = this.getRoots();

        const matches = await scanMatchesAsync({
          roots,
          keyword: kw,
          signal: controller.signal,
          caseSensitive: false,
        });

        if (controller.signal.aborted) return;

        this.matches = matches;
        this.activeIndex = computeInitialIndex(matches, this._anchorMsgId);

        // Scroll first, then render overlay (so highlight positions are correct)
        this.jumpToActive({ render: true, align: "start" });
      } catch (e) {
        if (e?.name !== "AbortError") {
          console.warn("[chat-search] failed", e);
        }
      } finally {
        if (this._abort === controller) this._abort = null;
      }
    },

    jumpToActive({ render = true, align = "center" } = {}) {
      const c = this.getContainer();
      if (!c || !this.total) {
        if (c) clearOverlay(c);
        return;
      }

      scrollToMatch({
        container: c,
        matches: this.matches,
        activeIndex: this.activeIndex,
        align,
      });

      // Render after scroll settles a bit
      if (render) {
        this.scheduleRender();
      }
    },

    // =====================
    // Overlay reflow (scroll/resize)
    // =====================
    scheduleRender() {
      const c = this.getContainer();
      if (!c) return;
      if (!this.highlightOn) return;

      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = requestAnimationFrame(() => {
        this._raf = 0;
        renderOverlay({
          container: c,
          matches: this.matches,
          activeIndex: this.activeIndex,
          highlight: this.highlightOn,
        });
      });
    },

    onViewportChange() {
      if (!this.open) return;
      this.scheduleRender();
    },

    onContainerScroll() {
      if (!this.open) return;
      this.scheduleRender();
    },

    setupContainerListener() {
      const c = this.getContainer();
      if (!c || this._listening) return;
      c.addEventListener("scroll", this.onContainerScroll, { passive: true });
      this._listening = true;
    },

    teardownContainerListener() {
      const c = this.getContainer();
      if (!c || !this._listening) return;
      c.removeEventListener("scroll", this.onContainerScroll);
      this._listening = false;
    },
  },
};
</script>

<style scoped>
.chat-searchbar {
  height: 44px;
  border-bottom: 1px solid var(--header-border, var(--border));
  /* Use plain tokens to ensure compatibility (some WebViews do not support color-mix) */
  background: var(--bg-surface);
  backdrop-filter: blur(10px);
  padding: 0 12px;
  display: flex;
  align-items: center;
}

.row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
}

.q {
  flex: 1;
  min-width: 0;
  height: 32px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  padding: 0 10px;
  outline: none;
  color: var(--text-primary);
}

.q:focus {
  border-color: var(--accent);
  box-shadow: none;
}

.chat-searchbar .icon {
  width: 24px;
  min-width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  color: var(--text-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.btn:hover {
  background: var(--bg-soft);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.on {
  border-color: var(--accent);
}

/* Fallback for themes where accent isn't blue: reuse accent by applying it via outline.
   (Box-shadow uses a neutral fallback above.) */

.count {
  font-size: 12px;
  color: var(--muted);
  width: 64px;
  text-align: center;
}

.count.disabled {
  opacity: 0.6;
}

@media (max-width: 520px) {
  .count {
    width: 56px;
  }
}
</style>
