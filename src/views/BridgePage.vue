<template>
  <div class="contract-runner-page">
    <section class="runner-hero">
      <div>
        <p class="eyebrow">Contract Runtime Tester</p>
        <h1>Swagger 명세 실제 실행 확인</h1>
        <p class="summary">
          Swagger와 동일한 contract를 사용합니다. REST/Web API는 mock 없이 backend까지 실제 호출하고,
          JS → Android는 AndroidBridge가 있으면 Native로, 없으면 Web Native Runtime으로 실행합니다.
        </p>
      </div>
      <div class="hero-actions">
        <RouterLink class="hero-link hero-link--secondary" to="/">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 10.5 12 4l8 6.5V20a.5.5 0 0 1-.5.5h-5v-6h-5v6h-5A.5.5 0 0 1 4 20v-9.5Z"/>
          </svg>
          홈
        </RouterLink>
        <RouterLink class="hero-link" to="/swagger">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 3.5h7.2L19 8.3V20a.5.5 0 0 1-.5.5h-11A2.5 2.5 0 0 1 5 18V5.5A2 2 0 0 1 7 3.5Z"/>
            <path d="M14 3.5V8h4.5"/>
            <path d="M8.5 12h7"/>
            <path d="M8.5 15.5h7"/>
          </svg>
          문서 보기
        </RouterLink>
      </div>
    </section>

    <div class="category-tabs" role="tablist" aria-label="contract category">
      <button
        v-for="option in categoryOptions"
        :key="option.value"
        class="category-tab"
        :class="{active: selectedCategory === option.value}"
        type="button"
        @click="selectedCategory = option.value"
      >
        {{ option.label }}
      </button>
    </div>

    <section class="runner-grid">
      <article
        v-for="item in visibleContracts"
        :key="item.type"
        class="runner-card"
      >
        <div class="card-head">
          <div>
            <span class="tag">{{ item.contract.tag }}</span>
            <h2>{{ item.type }}</h2>
          </div>
          <button class="run-button" type="button" @click="runContract(item)">
            실행
          </button>
        </div>

        <p class="description">{{ item.contract.description }}</p>

        <dl class="meta-list">
          <div>
            <dt>실행 방식</dt>
            <dd>{{ getRuntimeLabel(item.contract.category) }}</dd>
          </div>
          <div v-if="item.contract.httpPath">
            <dt>Backend</dt>
            <dd>{{ item.contract.httpMethod }} {{ item.contract.httpPath }}</dd>
          </div>
        </dl>

        <label class="payload-label" :for="`payload-${item.type}`">Request JSON</label>
        <textarea
          :id="`payload-${item.type}`"
          v-model="payloads[item.type]"
          class="payload-editor"
          spellcheck="false"
        ></textarea>
      </article>
    </section>

    <section class="result-panel">
      <div class="result-head">
        <div>
          <p class="eyebrow">Execution Result</p>
          <h2>실행 결과</h2>
        </div>
        <button class="clear-button" type="button" @click="result = ''">초기화</button>
      </div>
      <pre>{{ result || '아직 실행 결과가 없습니다.' }}</pre>
    </section>
  </div>
</template>

<script setup>
import {computed, reactive, ref} from "vue";
import {RouterLink} from "vue-router";
import {BRIDGE_CATEGORY} from "@/bridge/bridgeConstants";
import {BridgeContract} from "@/bridge/contract";
import {executeContract} from "@/bridge/bridgeClient";
import {getOpenApiCategoryOptions} from "@/bridge/openapi";

const categoryOptions = getOpenApiCategoryOptions();
const selectedCategory = ref(BRIDGE_CATEGORY.ALL);
const result = ref("");

const defaultPayloads = {
  GET_USER: {id: 1},
  LOGIN: {username: "admin", password: "1234"},
  UPLOAD_FILE: {fileName: "test.png", fileSize: 1024},
  GET_APP_VERSION: {},
  GET_PUSH_TOKEN: {},
  COPY_CLIPBOARD: {text: "복사할 내용"},
  ON_APP_RESUME: {source: "test-page"},
  ON_BACK_PRESSED: {canGoBack: true},
  ON_PUSH_CLICK: {
    notificationId: "notice-1000",
    route: "/notice/1000",
    payload: {type: "notice", id: "1000"},
  },
};

const payloads = reactive(
  Object.fromEntries(
    Object.keys(BridgeContract).map((type) => [
      type,
      JSON.stringify(defaultPayloads[type] || {}, null, 2),
    ])
  )
);

const visibleContracts = computed(() => {
  return Object.entries(BridgeContract)
    .map(([type, contract]) => ({type, contract}))
    .filter(({contract}) => selectedCategory.value === BRIDGE_CATEGORY.ALL || contract.category === selectedCategory.value);
});

function getRuntimeLabel(category) {
  if (category === BRIDGE_CATEGORY.WEB_API) return "실제 backend API 호출";
  if (category === BRIDGE_CATEGORY.JS_TO_ANDROID) return "AndroidBridge 또는 Web Native Runtime 실행";
  if (category === BRIDGE_CATEGORY.ANDROID_TO_JS) return "JS 이벤트 핸들러 수신 시뮬레이션";
  return "Contract 실행";
}

function parsePayload(type) {
  const text = payloads[type]?.trim();
  return text ? JSON.parse(text) : {};
}

async function runContract(item) {
  result.value = `${item.type} 실행 중...`;

  try {
    const payload = parsePayload(item.type);
    const response = await executeContract(item.contract.category, item.type, payload);
    result.value = JSON.stringify(response, null, 2);
  } catch (error) {
    result.value = `ERROR: ${error.message}\n${JSON.stringify(error.response || {}, null, 2)}`;
  }
}
</script>

<style scoped>
.contract-runner-page {
  box-sizing: border-box;
  height: 100dvh;
  min-height: 0;
  overflow-y: auto;
  padding: 28px;
  background: #f7f7f8;
  color: #111827;
  overscroll-behavior: contain;
}

.runner-hero,
.result-panel,
.runner-card {
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.06);
}

.runner-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 26px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.runner-hero h1,
.result-head h2,
.runner-card h2 {
  margin: 0;
  letter-spacing: -0.04em;
}

.runner-hero h1 {
  font-size: 30px;
}

.summary,
.description {
  color: #4b5563;
  line-height: 1.6;
}

.summary {
  max-width: 760px;
  margin: 12px 0 0;
}

.hero-actions {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  flex: 0 0 auto;
}

.hero-link,
.run-button,
.clear-button,
.category-tab {
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 800;
  text-decoration: none;
  transition: transform 160ms ease, background 160ms ease, color 160ms ease;
}

.hero-link,
.run-button {
  background: #111827;
  color: #fff;
}

.hero-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 11px 16px;
  white-space: nowrap;
}

.hero-link svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.hero-link--secondary {
  background: #ffffff;
  color: #111827;
  border: 1px solid #d1d5db;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 18px 0;
}

.category-tab {
  padding: 10px 14px;
  background: #fff;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.category-tab.active {
  background: #111827;
  color: #fff;
  border-color: #111827;
}

.runner-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.runner-card {
  padding: 20px;
}

.card-head,
.result-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.tag {
  display: inline-flex;
  margin-bottom: 8px;
  padding: 5px 9px;
  border-radius: 999px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 12px;
  font-weight: 800;
}

.run-button,
.clear-button {
  padding: 9px 14px;
}

.clear-button {
  background: #f3f4f6;
  color: #374151;
}

.meta-list {
  display: grid;
  gap: 8px;
  margin: 14px 0;
}

.meta-list div {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 10px;
}

.meta-list dt {
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
}

.meta-list dd {
  margin: 0;
  min-width: 0;
  color: #111827;
  font-size: 13px;
  word-break: break-all;
}

.payload-label {
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-size: 12px;
  font-weight: 900;
}

.payload-editor {
  box-sizing: border-box;
  width: 100%;
  min-height: 150px;
  resize: vertical;
  border: 1px solid #d1d5db;
  border-radius: 16px;
  padding: 12px;
  background: #0f172a;
  color: #d1fae5;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.55;
}

.result-panel {
  margin-top: 18px;
  padding: 20px;
}

.result-panel pre {
  box-sizing: border-box;
  min-height: 160px;
  max-height: min(48dvh, 560px);
  overflow: auto;
  margin: 14px 0 0;
  border-radius: 18px;
  padding: 16px;
  background: #0f172a;
  color: #d1fae5;
  font-size: 13px;
  line-height: 1.55;
}

@media (max-width: 720px) {
  .contract-runner-page {
    padding: 16px;
  }

  .runner-hero {
    flex-direction: column;
  }

  .hero-actions {
    width: 100%;
  }

  .hero-link {
    flex: 1 1 140px;
    width: auto;
    text-align: center;
  }
}
</style>
