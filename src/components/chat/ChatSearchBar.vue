<template>
  <div v-if="open" class="chat-searchbar" @keydown.esc.prevent="close">
    <div class="row">
      <!-- 검색 입력 -->
      <input
        ref="input"
        class="q"
        type="text"
        :value="keyword"
        placeholder="Search in chat..."
        @input="onInput"
        @keydown.enter.prevent="onEnter"
      />

      <!-- 옵션 패널 토글 -->
      <button
        type="button"
        class="btn btn-ghost"
        :class="{ on: showOptions }"
        title="Options"
        @click="toggleOptions"
      >
        <span class="icon">⚙</span>
      </button>

      <!-- ✅ Regex 모드에서만 Search 버튼 표시 -->
      <button
        v-if="options.mode === 'regex'"
        type="button"
        class="btn"
        title="Run search"
        @click="runSearch"
      >
        <span class="icon">
          <AppIcon name="search" size="xl" />
        </span>
      </button>

      <!-- 검색 카운트 -->
      <div class="count" :class="{ disabled: total === 0 }">
        {{ total ? current + " / " + total : "0 / 0" }}
      </div>

      <!-- First -->
      <button
        v-if="options.enableFirstLast"
        type="button"
        class="btn"
        :disabled="total === 0"
        title="First"
        @click="first"
      >
        <span class="icon">⏮</span>
      </button>

      <!-- Prev -->
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

      <!-- Next -->
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

      <!-- Last -->
      <button
        v-if="options.enableFirstLast"
        type="button"
        class="btn"
        :disabled="total === 0"
        title="Last"
        @click="last"
      >
        <span class="icon">⏭</span>
      </button>

      <!-- 닫기 -->
      <button type="button" class="btn" title="Close" @click="close">
        <span class="icon">
          <AppIcon name="x" size="xl" />
        </span>
      </button>
    </div>

    <!-- Options panel -->
    <transition name="opt">
      <div v-if="showOptions" class="options">
        <div class="opt-row">
          <div class="opt-label">Mode</div>
          <div class="opt-seg">
            <button
              type="button"
              class="seg"
              :class="{ on: options.mode === 'keyword' }"
              @click="setMode('keyword')"
            >
              KEY
            </button>
            <button
              type="button"
              class="seg"
              :class="{ on: options.mode === 'regex' }"
              @click="setMode('regex')"
            >
              REGEX
            </button>
          </div>
        </div>

        <div class="opt-grid">
          <label class="chk">
            <input
              type="checkbox"
              :checked="options.caseSensitive"
              @change="toggleCaseSensitive"
            />
            <span>Case</span>
          </label>

          <label class="chk">
            <input
              type="checkbox"
              :checked="options.wholeWord"
              @change="toggleWholeWord"
            />
            <span>Whole word</span>
          </label>

          <label class="chk">
            <input
              type="checkbox"
              :checked="options.enableFirstLast"
              @change="toggleFirstLast"
            />
            <span>First/Last</span>
          </label>

          <label class="chk">
            <input
              type="checkbox"
              :checked="options.highlight"
              @change="toggleHighlight"
            />
            <span>Highlight</span>
          </label>
        </div>

        <div class="opt-num-grid">
          <label class="num">
            <span class="num-label">Yield(nodes)</span>
            <input
              class="num-input"
              type="number"
              min="0"
              step="50"
              :value="options.yieldEveryNodes"
              @input="onYieldEveryNodes"
            />
          </label>
        </div>

        <div class="opt-actions">
          <button type="button" class="btn btn-reset" @click="resetOptions">
            Reset
          </button>
        </div>
      </div>
    </transition>
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
  DEFAULT_SEARCH_OPTIONS,
  mergeSearchOptions,
} from "@/utils/chatSearchOverlay";

export default {
  name: "ChatSearchBar",
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

      showOptions: false,
      options: mergeSearchOptions(DEFAULT_SEARCH_OPTIONS),

      _abort: null,
      _raf: 0,
      _anchorMsgId: null,
      _listening: false,
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
      return (
        this.containerEl ||
        document.querySelector(".body-contents") ||
        document.querySelector(".messages") ||
        null
      );
    },

    // Public API
    openWith({ anchorMsgId = null, keyword = "" } = {}) {
      this.open = true;
      this._anchorMsgId = anchorMsgId;
      if (keyword != null) this.keyword = String(keyword || "");

      this.$nextTick(() => {
        this.$refs.input?.focus?.();
        this.setupContainerListener();
        // keyword 모드는 즉시 검색, regex도 초기엔 실행해줘도 됨(원하면 제거 가능)
        this.runSearch();
      });
    },

    close() {
      this.open = false;
      this.showOptions = false;
      this._anchorMsgId = null;
      this.cancel();
      this.teardownContainerListener();
      this.clear();
    },

    // ✅ 빠졌던 함수: 옵션 패널 토글
    toggleOptions() {
      this.showOptions = !this.showOptions;
      // 옵션 패널 열고 닫을 때 높이가 변하므로 overlay 위치 재계산
      this.$nextTick(() => this.scheduleRender());
    },

    // UI handlers
    onInput(e) {
      this.keyword = String(e?.target?.value ?? "");

      // ✅ KEY 모드일 때만 key-in 즉시 검색
      if (this.options.mode === "keyword") {
        this.runSearch();
      }
    },

    onEnter(e) {
      // ✅ REGEX 모드: Enter는 "검색 실행"
      if (this.options.mode === "regex") {
        this.runSearch();
        return;
      }

      // ✅ KEY 모드: Enter는 next / Shift+Enter는 prev
      if (e?.shiftKey) this.prev();
      else this.next();
    },

    // ===== options mutations =====
    setMode(mode) {
      this.options = mergeSearchOptions({ ...this.options, mode });

      // 모드 변경 시:
      // - keyword: 입력값 있으면 즉시 검색 결과를 보여주는 편이 자연스러움
      // - regex: 기존 결과 유지 or 즉시 재검색(원하면 유지로 바꿔도 됨)
      this.runSearch();
    },

    toggleCaseSensitive() {
      this.options = mergeSearchOptions({
        ...this.options,
        caseSensitive: !this.options.caseSensitive,
      });
      this.runSearch();
    },

    toggleWholeWord() {
      this.options = mergeSearchOptions({
        ...this.options,
        wholeWord: !this.options.wholeWord,
      });
      this.runSearch();
    },

    toggleFirstLast() {
      this.options = mergeSearchOptions({
        ...this.options,
        enableFirstLast: !this.options.enableFirstLast,
      });
      // UI 옵션이라 re-search 불필요
    },

    toggleHighlight() {
      this.options = mergeSearchOptions({
        ...this.options,
        highlight: !this.options.highlight,
      });

      const c = this.getContainer();
      if (!c) return;

      if (!this.options.highlight) clearOverlay(c);
      else this.scheduleRender();
    },

    onYieldEveryNodes(e) {
      const v = Number(e?.target?.value ?? 250);
      this.options = mergeSearchOptions({
        ...this.options,
        yieldEveryNodes: Number.isFinite(v) ? Math.max(10, v) : 250,
      });
      // 검색 로직에 영향 -> 재검색
      this.runSearch();
    },

    resetOptions() {
      this.options = mergeSearchOptions(DEFAULT_SEARCH_OPTIONS);

      const c = this.getContainer();
      if (c) {
        if (!this.options.highlight) clearOverlay(c);
        else this.scheduleRender();
      }

      this.runSearch();
    },

    // Navigation
    first() {
      if (!this.total) return;
      this.activeIndex = 0;
      this.jumpToActive({ render: true, align: "start" });
    },

    last() {
      if (!this.total) return;
      this.activeIndex = this.total - 1;
      this.jumpToActive({ render: true, align: "end" });
    },

    prev() {
      if (!this.total) return;
      this.activeIndex =
        this.activeIndex <= 0 ? this.total - 1 : this.activeIndex - 1;
      this.jumpToActive({ render: true });
    },

    next() {
      if (!this.total) return;
      this.activeIndex =
        this.activeIndex >= this.total - 1 ? 0 : this.activeIndex + 1;
      this.jumpToActive({ render: true });
    },

    // Core search
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

      const roots = Array.from(c.querySelectorAll('[data-chat-msg-root="1"]'));
      if (roots.length) return roots;

      const byId = Array.from(c.querySelectorAll("[data-chat-msg-id]"));
      if (byId.length) return byId;

      return [c];
    },

    async runSearch() {
      const c = this.getContainer();
      if (!c) return;

      const kw = String(this.keyword || "").trim();

      // ✅ regex 모드에서 "빈 값"이면 clear
      if (!kw) {
        this.cancel();
        this.clear();
        return;
      }

      // ✅ regex 모드에서는 입력중 자동검색하지 않으므로,
      // enter/click 외에도 openWith 시점에서 호출되면 검색됨 (원하면 조건 추가 가능)
      this.cancel();
      const controller = new AbortController();
      this._abort = controller;

      try {
        await this.$nextTick();
        await new Promise((r) => requestAnimationFrame(r));
        await new Promise((r) => requestAnimationFrame(r));

        const roots = this.getRoots();

        const matches = await scanMatchesAsync({
          roots,
          keyword: kw,
          signal: controller.signal,
          options: this.options,
        });

        if (controller.signal.aborted) return;

        this.matches = matches;
        this.activeIndex = computeInitialIndex(matches, this._anchorMsgId);

        this.jumpToActive({ render: true, align: "start" });
      } catch (e) {
        if (e?.name !== "AbortError") console.warn("[chat-search] failed", e);
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

      if (render) this.scheduleRender();
    },

    // Overlay reflow
    scheduleRender() {
      const c = this.getContainer();
      if (!c) return;
      if (!this.options.highlight) return;

      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = requestAnimationFrame(() => {
        this._raf = 0;
        renderOverlay({
          container: c,
          matches: this.matches,
          activeIndex: this.activeIndex,
          highlight: this.options.highlight,
          options: this.options,
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
  border-bottom: 1px solid var(--header-border, var(--border));
  background: var(--bg-surface);
  backdrop-filter: blur(10px);
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  padding: 0 10px;
  outline: none;
  color: var(--text-primary);
}

.q:focus {
  border-color: var(--accent);
}

.icon {
  width: 24px;
  min-width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
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
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}

.btn:hover {
  background: var(--bg-soft);
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn.on {
  border-color: var(--accent);
}

.btn-ghost {
  width: 36px;
  height: 36px;
  background: transparent;
}

.count {
  font-size: 12px;
  color: var(--text-muted, var(--muted));
  width: 72px;
  text-align: center;
}

.count.disabled {
  opacity: 0.6;
}

.options {
  border: 1px solid var(--border);
  background: var(--bg-elevated);
  border-radius: 14px;
  padding: 10px 12px;
  box-shadow: var(--shadow-sm, 0 10px 26px rgba(0, 0, 0, 0.1));
}

.opt-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.opt-label {
  font-size: 12px;
  color: var(--text-muted, var(--muted));
  letter-spacing: 0.2px;
}

.opt-seg {
  display: inline-flex;
  gap: 6px;
  padding: 4px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
}

.seg {
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-muted, var(--muted));
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

.seg.on {
  background: var(--bg-elevated);
  border-color: var(--accent);
  color: var(--text-primary);
}

.opt-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
}

.chk {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-primary);
  user-select: none;
}

.chk input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
}

.opt-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.btn-reset {
  width: auto;
  height: 32px;
  padding: 0 12px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-primary);
}

.btn-reset:hover {
  border-color: var(--accent);
}

.opt-enter-active,
.opt-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}
.opt-enter-from,
.opt-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.opt-num-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 12px;
  margin-top: 10px;
}

.num {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.num-label {
  font-size: 12px;
  color: var(--text-muted, var(--muted));
}

.num-input {
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-primary);
  padding: 0 10px;
  outline: none;
}

.num-input:focus {
  border-color: var(--accent);
}

@media (max-width: 520px) {
  .count {
    width: 60px;
  }
  .opt-grid {
    grid-template-columns: 1fr;
  }
}
</style>
