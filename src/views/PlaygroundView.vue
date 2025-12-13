<template>
  <div class="playground">
    <!-- Header -->
    <div class="pg-head">
      <div class="pg-title">Playground</div>

      <div class="pg-meta">
        <span class="pg-pill">
          width: <b>{{ width }}</b
          >px
        </span>
        <span class="pg-pill">
          breakpoint: <b>{{ bpLabel }}</b>
        </span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="pg-tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        class="pg-tab"
        :class="{ active: activeTab === t.key }"
        @click="activeTab = t.key"
      >
        {{ t.label }}
      </button>
    </div>

    <!-- Tab Panels -->
    <div class="pg-panel">
      <!-- ✅ Data 탭 -->
      <template v-if="activeTab === 'data'">
        <div class="grid">
          <!-- Breakpoint preview -->
          <section class="card">
            <div class="card-head">
              <div class="card-title">Breakpoint Preview</div>
              <div class="card-sub">
                sm / md / lg 환경에서 컴포넌트가 어떻게 보이는지 확인
              </div>
            </div>

            <div class="row">
              <div class="kv">
                <div class="k">Current</div>
                <div class="v">
                  <span class="badge" :class="`badge-${bpLabel}`">{{
                    bpLabel.toUpperCase()
                  }}</span>
                  <span class="hint">({{ width }}px)</span>
                </div>
              </div>

              <div class="kv">
                <div class="k">Rules</div>
                <div class="v hint">sm: &lt; 768, md: 768~991, lg: ≥ 992</div>
              </div>
            </div>

            <div class="preview-wrap">
              <div class="preview">
                <div class="preview-title">Buttons</div>
                <div class="preview-body">
                  <div class="btn-row">
                    <button class="btn btn-primary btn-sm">Primary SM</button>
                    <button class="btn btn-primary btn-md">Primary MD</button>
                    <button class="btn btn-primary btn-lg">Primary LG</button>
                  </div>

                  <div class="btn-row">
                    <button class="btn btn-ghost btn-sm">Ghost SM</button>
                    <button class="btn btn-ghost btn-md">Ghost MD</button>
                    <button class="btn btn-ghost btn-lg">Ghost LG</button>
                  </div>

                  <div class="btn-row">
                    <button class="btn btn-danger btn-sm">Danger SM</button>
                    <button class="btn btn-danger btn-md">Danger MD</button>
                    <button class="btn btn-danger btn-lg">Danger LG</button>
                  </div>

                  <div class="btn-row">
                    <button class="btn btn-primary btn-md" disabled>
                      Disabled
                    </button>
                    <button class="btn btn-ghost btn-md" disabled>
                      Disabled
                    </button>
                  </div>
                </div>
              </div>

              <div class="preview">
                <div class="preview-title">Labels / Badges</div>
                <div class="preview-body">
                  <div class="label-row">
                    <span class="label label-sm">Label SM</span>
                    <span class="label label-md">Label MD</span>
                    <span class="label label-lg">Label LG</span>
                  </div>

                  <div class="label-row">
                    <span class="badge badge-sm">badge</span>
                    <span class="badge badge-md">badge</span>
                    <span class="badge badge-lg">badge</span>
                  </div>

                  <div class="label-row">
                    <span class="badge badge-success">success</span>
                    <span class="badge badge-warn">warn</span>
                    <span class="badge badge-danger">danger</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Forms -->
          <section class="card">
            <div class="card-head">
              <div class="card-title">Forms</div>
              <div class="card-sub">
                input / select / switch + form-sm/md/lg
              </div>
            </div>

            <div class="form-grid">
              <div class="field">
                <label class="field-label">Text (form-sm)</label>
                <input class="input form-sm" placeholder="form-sm" />
              </div>

              <div class="field">
                <label class="field-label">Text (form-md)</label>
                <input class="input form-md" placeholder="form-md" />
              </div>

              <div class="field">
                <label class="field-label">Text (form-lg)</label>
                <input class="input form-lg" placeholder="form-lg" />
              </div>

              <div class="field">
                <label class="field-label">Select</label>
                <select class="select form-md">
                  <option>Option A</option>
                  <option>Option B</option>
                  <option>Option C</option>
                </select>
              </div>

              <div class="field">
                <label class="field-label">Textarea</label>
                <textarea
                  class="textarea form-md"
                  rows="3"
                  placeholder="multiline..."
                ></textarea>
              </div>

              <div class="field">
                <label class="field-label">Switch</label>
                <div class="switch-row">
                  <button
                    class="switch"
                    :class="{ on: demoSwitch }"
                    @click="demoSwitch = !demoSwitch"
                    type="button"
                  >
                    <span class="knob"></span>
                  </button>
                  <span class="hint">{{ demoSwitch ? "ON" : "OFF" }}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Cards / Layout -->
          <section class="card">
            <div class="card-head">
              <div class="card-title">Cards / Responsive Layout</div>
              <div class="card-sub">
                현재 breakpoint에 따라 카드 그리드가 달라짐
              </div>
            </div>

            <div class="card-grid" :class="`cols-${cols}`">
              <div class="mini-card" v-for="n in 6" :key="n">
                <div class="mini-title">Card {{ n }}</div>
                <div class="mini-body">
                  <div class="hint">bp: {{ bpLabel }} / cols: {{ cols }}</div>
                  <div class="mini-actions">
                    <button class="btn btn-ghost btn-sm">Action</button>
                    <button class="btn btn-primary btn-sm">Go</button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Table-ish -->
          <section class="card">
            <div class="card-head">
              <div class="card-title">Data Rows</div>
              <div class="card-sub">리스트/행 UI 간단 샘플</div>
            </div>

            <div class="rows">
              <div class="row-item" v-for="r in rows" :key="r.id">
                <div class="row-left">
                  <div class="row-title">{{ r.title }}</div>
                  <div class="row-sub">{{ r.desc }}</div>
                </div>
                <div class="row-right">
                  <span class="badge badge-md" :class="r.badgeClass">{{
                    r.status
                  }}</span>
                  <button class="btn btn-ghost btn-sm">Open</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </template>

      <!-- 기존 다른 탭들(유지) -->
      <template v-else-if="activeTab === 'navigators'">
        <div class="empty">
          Navigators 탭 (유지) — 필요하면 여기에도 샘플 추가 가능
        </div>
      </template>

      <template v-else-if="activeTab === 'theme'">
        <div class="empty">
          Theme 탭 (유지) — 테마 토큰/컬러 프리뷰 넣을 수 있음
        </div>
      </template>

      <template v-else>
        <div class="empty">준비중</div>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: "PlaygroundView",
  data() {
    return {
      activeTab: "data",
      demoSwitch: true,
      tabs: [
        { key: "data", label: "Data" },
        { key: "navigators", label: "Navigators" },
        { key: "theme", label: "Theme" },
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
    width() {
      return (
        this.$responsive?.width ??
        (typeof window !== "undefined" ? window.innerWidth : 1200)
      );
    },
    bpLabel() {
      return this.$responsive?.bp || "lg";
    },
    cols() {
      // 카드 그리드 컬럼 수
      if (this.bpLabel === "sm") return 1;
      if (this.bpLabel === "md") return 2;
      return 3;
    },
  },
  mounted() {
    // no-op (responsiveManager handles resize)
  },
};
</script>

<style scoped>
.playground {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  overflow: auto;
}

.pg-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.pg-title {
  font-size: 18px;
  font-weight: 800;
}

.pg-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pg-pill {
  padding: 6px 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.7);
}

.pg-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding-bottom: 10px;
}

.pg-tab {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.7);
  font-weight: 700;
  cursor: pointer;
}

.pg-tab.active {
  border-color: rgba(0, 0, 0, 0.22);
}

.pg-panel {
  flex: 1;
  min-height: 0;
}

.grid {
  display: grid;
  gap: 14px;
}

.card {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.85);
  padding: 14px;
}

.card-head {
  margin-bottom: 12px;
}
.card-title {
  font-weight: 900;
}
.card-sub {
  margin-top: 4px;
  color: rgba(0, 0, 0, 0.55);
  font-size: 12px;
}

.row {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
}
.kv {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 10px;
  align-items: center;
}
.k {
  font-weight: 800;
  color: rgba(0, 0, 0, 0.65);
}
.v {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.hint {
  color: rgba(0, 0, 0, 0.55);
  font-size: 12px;
}

.preview-wrap {
  display: grid;
  gap: 12px;
}
@media (min-width: 992px) {
  .preview-wrap {
    grid-template-columns: 1fr 1fr;
  }
}

.preview {
  border: 1px dashed rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  padding: 12px;
}
.preview-title {
  font-weight: 900;
  margin-bottom: 10px;
}
.preview-body {
  display: grid;
  gap: 10px;
}
.btn-row,
.label-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

/* Buttons */
.btn {
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 8px 12px;
  font-weight: 800;
  cursor: pointer;
  background: white;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-sm {
  padding: 6px 10px;
  font-size: 12px;
}
.btn-md {
  padding: 8px 12px;
  font-size: 13px;
}
.btn-lg {
  padding: 10px 14px;
  font-size: 14px;
}

.btn-primary {
  background: rgba(37, 99, 235, 0.12);
  border-color: rgba(37, 99, 235, 0.35);
}
.btn-danger {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.35);
}
.btn-ghost {
  background: rgba(0, 0, 0, 0.03);
}

/* Labels / Badges */
.label {
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.02);
  font-weight: 800;
  padding: 6px 10px;
}
.label-sm {
  font-size: 12px;
  padding: 5px 8px;
}
.label-md {
  font-size: 13px;
}
.label-lg {
  font-size: 14px;
  padding: 8px 12px;
}

.badge {
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 6px 10px;
  font-weight: 900;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.02);
}
.badge-sm {
  padding: 4px 8px;
}
.badge-md {
  padding: 6px 10px;
}
.badge-lg {
  padding: 8px 12px;
}

.badge-success {
  background: rgba(34, 197, 94, 0.12);
  border-color: rgba(34, 197, 94, 0.35);
}
.badge-warn {
  background: rgba(245, 158, 11, 0.12);
  border-color: rgba(245, 158, 11, 0.35);
}
.badge-danger {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.35);
}

.badge-sm {
}
.badge-md {
}
.badge-lg {
}

.badge-sm.badge-sm,
.badge-md.badge-md,
.badge-lg.badge-lg {
}

/* breakpoint badge (decorative) */
.badge-sm {
}
.badge-md {
}
.badge-lg {
}
.badge-sm::after {
  content: "";
}
.badge-md::after {
  content: "";
}
.badge-lg::after {
  content: "";
}

.badge-sm.badge-sm,
.badge-md.badge-md,
.badge-lg.badge-lg {
}

/* Form */
.form-grid {
  display: grid;
  gap: 12px;
}
@media (min-width: 992px) {
  .form-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

.field {
  display: grid;
  gap: 6px;
}
.field-label {
  font-size: 12px;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.65);
}

.input,
.select,
.textarea {
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 10px 12px;
  outline: none;
  background: white;
}
.form-sm {
  padding: 8px 10px;
  font-size: 12px;
}
.form-md {
  padding: 10px 12px;
  font-size: 13px;
}
.form-lg {
  padding: 12px 14px;
  font-size: 14px;
}

.switch-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.switch {
  width: 44px;
  height: 26px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.08);
  position: relative;
  cursor: pointer;
}
.switch .knob {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: white;
  position: absolute;
  top: 1px;
  left: 1px;
  transition: transform 0.18s ease;
  border: 1px solid rgba(0, 0, 0, 0.08);
}
.switch.on {
  background: rgba(37, 99, 235, 0.25);
  border-color: rgba(37, 99, 235, 0.35);
}
.switch.on .knob {
  transform: translateX(18px);
}

/* Cards grid */
.card-grid {
  display: grid;
  gap: 12px;
}
.card-grid.cols-1 {
  grid-template-columns: 1fr;
}
.card-grid.cols-2 {
  grid-template-columns: 1fr 1fr;
}
.card-grid.cols-3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.mini-card {
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 12px;
  background: rgba(255, 255, 255, 0.9);
}
.mini-title {
  font-weight: 900;
  margin-bottom: 8px;
}
.mini-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

/* Rows */
.rows {
  display: grid;
  gap: 10px;
}
.row-item {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.row-title {
  font-weight: 900;
}
.row-sub {
  margin-top: 4px;
  color: rgba(0, 0, 0, 0.55);
  font-size: 12px;
}
.row-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.empty {
  border: 1px dashed rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.8);
  color: rgba(0, 0, 0, 0.55);
  font-weight: 700;
}
</style>
