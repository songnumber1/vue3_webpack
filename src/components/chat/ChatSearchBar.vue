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
        <span class="icon">
          <AppIcon name="settings" size="sm" />
        </span>
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
          <AppIcon name="search" size="sm" />
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
        <span class="icon">
          <AppIcon name="first" size="sm" />
        </span>
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
          <AppIcon name="chevron-left" size="sm" />
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
          <AppIcon name="chevron-right" size="sm" />
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
        <span class="icon"><AppIcon name="last" size="sm" /> </span>
      </button>

      <!-- 닫기 -->
      <button type="button" class="btn" title="Close" @click="close">
        <span class="icon">
          <AppIcon name="x" size="sm" />
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
              :checked="options.autoScrollOnSearch"
              @change="toggleAutoScroll"
            />
            <span>Auto scroll on search</span>
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
  computeViewportIndex,
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
    // 검색 대상 컨테이너 반환
    getContainer() {
      return (
        this.containerEl || // 외부에서 전달된 컨테이너 우선
        document.querySelector(".body-contents") ||
        document.querySelector(".messages") ||
        null
      );
    },

    // 검색창 열기 + 초기 검색 실행
    openWith({ anchorMsgId = null, keyword = "" } = {}) {
      this.open = true;
      this._anchorMsgId = anchorMsgId;
      if (keyword != null) this.keyword = String(keyword || "");

      this.$nextTick(() => {
        this.$refs.input?.focus?.(); // 입력창 포커스
        this.setupContainerListener(); // 스크롤 감지 시작
        this.runSearch(); // 초기 검색 실행
      });
    },

    // 검색창 닫기 + 상태 초기화
    close() {
      this.open = false;
      this.showOptions = false;
      this._anchorMsgId = null;
      this.cancel(); // 진행 중 검색 취소
      this.teardownContainerListener(); // 스크롤 감지 제거
      this.clear(); // overlay 및 matches 초기화
    },

    // 옵션 패널 열기/닫기
    toggleOptions() {
      this.showOptions = !this.showOptions;
      this.$nextTick(() => this.scheduleRender()); // 레이아웃 변경 후 overlay 재계산
    },

    // 입력 시 (KEY 모드일 때만 자동 검색)
    onInput(e) {
      this.keyword = String(e?.target?.value ?? "");
      if (this.options.mode === "keyword") this.runSearch();
    },

    // Enter 키 처리
    onEnter(e) {
      if (this.options.mode === "regex") {
        // REGEX 모드는 Enter = 검색 실행
        this.runSearch();
        return;
      }
      // KEY 모드는 Enter = 다음, Shift+Enter = 이전
      if (e?.shiftKey) this.prev();
      else this.next();
    },

    // 검색 모드 변경 (keyword / regex)
    setMode(mode) {
      this.options = mergeSearchOptions({ ...this.options, mode });
      this.runSearch(); // 모드 변경 시 재검색
    },

    // 대소문자 옵션 토글
    toggleCaseSensitive() {
      this.options = mergeSearchOptions({
        ...this.options,
        caseSensitive: !this.options.caseSensitive,
      });
      this.runSearch();
    },

    // 완전 단어 일치 옵션 토글
    toggleWholeWord() {
      this.options = mergeSearchOptions({
        ...this.options,
        wholeWord: !this.options.wholeWord,
      });
      this.runSearch();
    },

    // First/Last 버튼 표시 여부 토글 (UI 전용)
    toggleFirstLast() {
      this.options = mergeSearchOptions({
        ...this.options,
        enableFirstLast: !this.options.enableFirstLast,
      });
    },

    // 검색 시 자동 스크롤 여부 토글
    toggleAutoScroll() {
      this.options = mergeSearchOptions({
        ...this.options,
        autoScrollOnSearch: !this.options.autoScrollOnSearch,
      });
      // 즉시 재검색은 하지 않음 (다음 검색부터 반영)
    },

    // 하이라이트 표시 여부 토글
    toggleHighlight() {
      this.options = mergeSearchOptions({
        ...this.options,
        highlight: !this.options.highlight,
      });

      const c = this.getContainer();
      if (!c) return;

      // 끄면 overlay 제거, 켜면 재렌더
      if (!this.options.highlight) clearOverlay(c);
      else this.scheduleRender();
    },

    // yieldEveryNodes 값 변경 (성능 관련 옵션)
    onYieldEveryNodes(e) {
      const v = Number(e?.target?.value ?? 250);
      this.options = mergeSearchOptions({
        ...this.options,
        yieldEveryNodes: Number.isFinite(v) ? Math.max(10, v) : 250,
      });
      this.runSearch(); // DOM 스캔 로직 영향 → 재검색 필요
    },

    // 옵션 초기화
    resetOptions() {
      this.options = mergeSearchOptions(DEFAULT_SEARCH_OPTIONS);

      const c = this.getContainer();
      if (c) {
        if (!this.options.highlight) clearOverlay(c);
        else this.scheduleRender();
      }

      this.runSearch();
    },

    /* =========================
     Navigation 영역
  ========================== */

    // 첫 번째 매칭으로 이동
    first() {
      if (!this.total) return;
      this.activeIndex = 0;
      this.jumpToActive({ render: true, align: "start", doScroll: true });
    },

    // 마지막 매칭으로 이동
    last() {
      if (!this.total) return;
      this.activeIndex = this.total - 1;
      this.jumpToActive({ render: true, align: "end", doScroll: true });
    },

    // 이전 매칭으로 이동
    prev() {
      if (!this.total) return;

      this.activeIndex =
        this.activeIndex <= 0 ? this.total - 1 : this.activeIndex - 1;

      this.jumpToActive({ render: true, doScroll: true });
    },

    // 다음 매칭으로 이동
    next() {
      if (!this.total) return;

      this.activeIndex =
        this.activeIndex >= this.total - 1 ? 0 : this.activeIndex + 1;

      this.jumpToActive({ render: true, doScroll: true });
    },

    /* =========================
     검색 제어
  ========================== */

    // 현재 진행 중인 검색 취소
    cancel() {
      if (this._abort) {
        try {
          this._abort.abort();
        } catch (_) {}
        this._abort = null;
      }
    },

    // 검색 결과 초기화
    clear() {
      const c = this.getContainer();
      if (c) clearOverlay(c);
      this.matches = [];
      this.activeIndex = 0;
    },

    // 검색 대상 루트 노드 추출
    getRoots() {
      const c = this.getContainer();
      if (!c) return [];

      const roots = Array.from(c.querySelectorAll('[data-chat-msg-root="1"]'));
      if (roots.length) return roots;

      const byId = Array.from(c.querySelectorAll("[data-chat-msg-id]"));
      if (byId.length) return byId;

      return [c];
    },

    // ==========================
    // 실제 검색 실행
    // ==========================
    async runSearch() {
      const c = this.getContainer();
      if (!c) return;

      const kw = String(this.keyword || "").trim();

      // 검색어 없으면 초기화
      if (!kw) {
        this.cancel();
        this.clear();
        return;
      }

      this.cancel();
      const controller = new AbortController();
      this._abort = controller;

      try {
        // DOM 안정화 대기
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

        // autoScroll 옵션 분기 처리
        if (this.options.autoScrollOnSearch) {
          // 기존 anchor 기준
          this.activeIndex = computeInitialIndex(matches, this._anchorMsgId);
          this.jumpToActive({ render: true, align: "start", doScroll: true });
        } else {
          // 현재 화면 기준 index 계산
          this.activeIndex = computeViewportIndex(c, matches);
          this.scheduleRender(); // 스크롤 유지
        }
      } catch (e) {
        if (e?.name !== "AbortError") console.warn("[chat-search] failed", e);
      } finally {
        if (this._abort === controller) this._abort = null;
      }
    },

    // 현재 activeIndex 위치로 이동
    jumpToActive({ render = true, align = "center", doScroll = true } = {}) {
      const c = this.getContainer();
      if (!c || !this.total) {
        if (c) clearOverlay(c);
        return;
      }

      // 스크롤 허용일 때만 이동
      if (doScroll) {
        scrollToMatch({
          container: c,
          matches: this.matches,
          activeIndex: this.activeIndex,
          align,
        });
      }

      if (render) this.scheduleRender();
    },

    /* =========================
     Overlay 재렌더
  ========================== */

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

    // 화면 리사이즈 시 overlay 재계산
    onViewportChange() {
      if (!this.open) return;
      this.scheduleRender();
    },

    // 스크롤 시 overlay 재계산
    onContainerScroll() {
      if (!this.open) return;
      this.scheduleRender();
    },

    // 컨테이너 스크롤 이벤트 등록
    setupContainerListener() {
      const c = this.getContainer();
      if (!c || this._listening) return;

      c.addEventListener("scroll", this.onContainerScroll, { passive: true });
      this._listening = true;
    },

    // 컨테이너 스크롤 이벤트 제거
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
