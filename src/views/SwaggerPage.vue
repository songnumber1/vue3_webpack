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
          <img :src="homeIcon" alt="" aria-hidden="true" />
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
import homeIcon from "@/assets/img/icons/home.svg";

const {t} = useI18n();
import {nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import {RouterLink} from "vue-router";
import {BRIDGE_CATEGORY} from "@/bridge/bridgeConstants";
import {generateOpenApi, getOpenApiCategoryOptions} from "@/bridge/openapi";
import {
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
function clearSwaggerRoot() {
  if (swaggerRoot.value) {
    swaggerRoot.value.innerHTML = "";
  }
}
const renderSwagger = async () => {
  renderError.value = "";

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

onMounted(async () => {
  installWebViewCompat();
  installSwaggerRuntime();
  await renderSwagger();
});

onBeforeUnmount(() => {
  if (swaggerInstance?.getSystem) {
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
  font-size: var(--text-size-body-strong);
  color: #111827;
}

.swagger-toolbar p {
  margin: 0;
  font-size: var(--text-size-helper);
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
  font-size: var(--text-size-helper);
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
  font-size: var(--text-size-body);
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
