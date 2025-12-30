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

      <template v-else-if="activeTab === 'modal'">
        <div class="card">
          <div class="card-head">
            <div class="card-title">Modal Playground</div>
            <div class="card-sub">
              modalManager 기반 sm / md / lg 모달 테스트
            </div>
          </div>

          <div class="btn-row btn-container">
            <button class="btn btn-primary btn-sm" @click="open('sm')">
              Open SM
            </button>
            <button class="btn btn-primary btn-md" @click="open('md')">
              Open MD
            </button>
            <button class="btn btn-primary btn-lg" @click="open('lg')">
              Open LG
            </button>
          </div>
        </div>
      </template>

      <template v-else-if="activeTab === 'storage'">
        <section class="card">
          <div class="card-head">
            <div class="card-title">Storage Playground</div>
            <div class="card-sub">local / session / cookie / indexed</div>
          </div>

          <div class="form-grid">
            <div class="field">
              <label>Type</label>
              <select v-model="storageType" class="select">
                <option value="local">localStorage</option>
                <option value="session">sessionStorage</option>
                <option value="cookie">cookie</option>
                <option value="indexed">indexedDB</option>
              </select>
            </div>

            <div class="field">
              <label>Key</label>
              <input v-model="storageKey" class="input" />
            </div>

            <div class="field">
              <label>Value</label>
              <textarea v-model="storageValue" rows="3" class="textarea" />
            </div>
          </div>

          <div class="btn-row btn-container">
            <button class="btn btn-primary" @click="saveStorage">Save</button>
            <button class="btn btn-ghost" @click="loadStorage">Load</button>
            <button class="btn btn-danger" @click="deleteStorage">
              Delete
            </button>
          </div>

          <div class="preview">
            <div class="preview-title">Result</div>
            <pre>{{ storageResult }}</pre>
          </div>
        </section>
      </template>

      <template v-else>
        <div class="empty">준비중</div>
      </template>
    </div>
  </div>
</template>

<script>
import { openModal } from "@/plugins/modalManager";
import {
  setStorage,
  getStorage,
  removeStorage,
} from "@/plugins/storageManager";
import SampleFormModal from "@/components/sample/SampleFormModal.vue";

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
        { key: "modal", label: "Modal" },
        { key: "storage", label: "Storage" },
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
      storageType: "local",
      storageKey: "pg_demo",
      storageValue: "",
      storageResult: null,
    };
  },
  computed: {
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

  methods: {
    async open(size) {
      console.log("Playground open:", size);
      const result = await openModal(SampleFormModal, {}, size);
      console.log("modal result:", result);

      if (result) {
        console.log("저장됨:", result);
        // 👉 여기서 메인 화면 상태 업데이트 가능
      } else {
        console.log("취소됨");
      }
    },

    async saveStorage() {
      const res = await setStorage(
        this.storageType,
        this.storageKey,
        this.parseValue(this.storageValue)
      );

      this.storageResult = res;
    },

    async loadStorage() {
      console.log(this.storageType);
      const res = await getStorage(this.storageType, this.storageKey);

      this.storageResult = res;
    },

    async deleteStorage() {
      const res = await removeStorage(this.storageType, this.storageKey);

      this.storageResult = res;
    },

    parseValue(value) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    },
  },
};
</script>
