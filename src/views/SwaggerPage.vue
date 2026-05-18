<template>
  <div class="swagger-page">
    <div class="swagger-toolbar">
      <div>
        <strong>Contract Category</strong>
        <p>
          Swagger 화면에서 REST/Web API, JS → Android, Android → JS 명세를
          전환합니다.
        </p>
      </div>

      <div class="toolbar-actions">
        <RouterLink
          class="toolbar-link"
          to="/"
          :title="t('swagger.goHome')"
          :aria-label="t('swagger.goHome')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 10.5 12 4l8 6.5V20a.5.5 0 0 1-.5.5h-5v-6h-5v6h-5A.5.5 0 0 1 4 20v-9.5Z"
            />
          </svg>
          {{ t("swagger.home") }}
        </RouterLink>
        <select
          v-model="selectedCategory"
          class="category-select"
          @change="renderSwagger"
        >
          <option
            v-for="option in categoryOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="renderError" class="swagger-error">
      <strong>{{ t("swagger.renderError") }}</strong>
      <p>{{ renderError }}</p>
    </div>

    <div ref="swaggerRoot" class="swagger-root"></div>
  </div>
</template>

<script setup>
import {useI18n} from "vue-i18n";

const {t} = useI18n();
import {nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import {RouterLink} from "vue-router";
import {BRIDGE_CATEGORY} from "@/bridge/bridgeConstants";
import {generateOpenApi, getOpenApiCategoryOptions} from "@/bridge/openapi";
import {
  // 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
  installSwaggerRuntime,
  uninstallSwaggerRuntime,
} from "@/bridge/swaggerRuntime";
import {installWebViewCompat} from "@/utils/webviewCompat";
import {logError} from "@/utils/logger";

let swaggerInstance = null;

const swaggerRoot = ref(null);
const renderError = ref("");
const categoryOptions = getOpenApiCategoryOptions();
const selectedCategory = ref(BRIDGE_CATEGORY.ALL);

/**
 * @description clearSwaggerRoot 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function clearSwaggerRoot() {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (swaggerRoot.value) {
    swaggerRoot.value.innerHTML = "";
  }
}

/**
 * @description renderSwagger 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
const renderSwagger = async () => {
  renderError.value = "";

  // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
  try {
    installWebViewCompat();
    const [{default: SwaggerUI}] = await Promise.all([
      import(
        /* webpackChunkName: "swagger-ui-runtime" */ "swagger-ui-dist/swagger-ui-es-bundle"
      ),
      import(
        /* webpackChunkName: "swagger-ui-style" */ "swagger-ui-dist/swagger-ui.css"
      ),
    ]);
    const spec = generateOpenApi(selectedCategory.value);

    await nextTick();
    clearSwaggerRoot();

    // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
    if (!swaggerRoot.value) return;

    swaggerInstance = SwaggerUI({
      spec,
      domNode: swaggerRoot.value,
      deepLinking: true,
      displayRequestDuration: true,
      docExpansion: "list",
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      validatorUrl: null,
      supportedSubmitMethods: [
        "get",
        "post",
        "put",
        "delete",
        "patch",
        "head",
        "options",
      ],
      tryItOutEnabled: false,
    });
  } catch (error) {
    renderError.value = error?.message || t("swagger.renderErrorFallback");
    logError("[SwaggerPage] render failed", error);
  }
};

// Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
onMounted(async () => {
  installWebViewCompat();
  installSwaggerRuntime();
  await renderSwagger();
});

// Vue 반응형 실행 구간입니다. 상태 변경과 생명주기 흐름을 이 영역에서 연결합니다.
onBeforeUnmount(() => {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (swaggerInstance?.getSystem) {
    // 브라우저/API 실행 중 발생할 수 있는 예외를 안전하게 처리합니다.
    try {
      swaggerInstance.getSystem().specActions.updateSpec("");
    } catch (error) {
      void error;
    }
  }
  swaggerInstance = null;
  clearSwaggerRoot();
  uninstallSwaggerRuntime();
});
</script>

<style scoped>
.swagger-page {
  width: 100%;
  height: var(--app-height, 100vh);
  overflow: auto;
  -webkit-overflow-scrolling: touch;
  background: #ffffff;
  color: #111827;
}

.swagger-toolbar {
  position: sticky;
  top: 0;
  z-index: var(--z-content-raised);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 24px;
  border-bottom: 1px solid #e5e7eb;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(8px);
}

.swagger-toolbar strong {
  display: block;
  margin-bottom: 4px;
  font-size: 15px;
  color: #111827;
}

.swagger-toolbar p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-link {
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  background: #ffffff;
  color: #111827;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  transition:
    background 160ms ease,
    transform 160ms ease,
    border-color 160ms ease;
}

.toolbar-link:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  transform: translateY(-1px);
}

.toolbar-link svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.category-select {
  min-width: 220px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #111827;
  font-size: 14px;
}

.swagger-root {
  min-height: calc(var(--app-height, 100vh) - 72px);
  background: #ffffff;
}

.swagger-error {
  margin: 16px 24px 0;
  padding: 14px 16px;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fef2f2;
  color: #991b1b;
}

.swagger-error strong {
  display: block;
  margin-bottom: 6px;
}

.swagger-error p {
  margin: 0;
  line-height: 1.5;
  word-break: break-word;
}

:deep(.swagger-ui) {
  color: #111827;
}

:deep(.swagger-ui .scheme-container) {
  display: none;
}

:deep(.curl),
:deep(.request-url) {
  display: none !important;
}

@media (max-width: 640px) {
  .swagger-toolbar {
    align-items: stretch;
    flex-direction: column;
    padding: 12px 14px;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: stretch;
  }

  .toolbar-link,
  .category-select {
    flex: 1 1 auto;
  }

  .category-select {
    width: 100%;
  }

  .swagger-root {
    min-height: calc(var(--app-height, 100vh) - 132px);
  }
}
</style>
