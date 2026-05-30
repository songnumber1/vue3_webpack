<template>
  <div class="swagger-page h-[var(--app-height,100vh)] w-full overflow-auto bg-white text-slate-900">
    <div class="swagger-toolbar sticky top-0 z-[var(--z-content-raised)] flex items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-6 py-3.5 backdrop-blur mobile:flex-col mobile:items-stretch mobile:px-3.5 mobile:py-3">
      <div>
        <strong class="mb-1 block text-[var(--text-size-body-strong)] text-slate-900">Contract Category</strong>
        <p class="m-0 text-[var(--text-size-helper)] text-slate-500">
          Swagger 화면에서 REST/Web API, JS → Android, Android → JS 명세를
          전환합니다.
        </p>
      </div>

      <div class="toolbar-actions flex flex-wrap items-center justify-end gap-2.5 mobile:w-full mobile:justify-stretch">
        <RouterLink
          class="toolbar-link inline-flex h-9 items-center justify-center gap-[7px] rounded-full border border-slate-300 bg-white px-3 text-[var(--text-size-helper)] font-extrabold text-slate-900 no-underline transition hover:-translate-y-px hover:border-slate-400 hover:bg-slate-100 mobile:flex-1 [&>svg]:size-[17px] [&>svg]:fill-none [&>svg]:stroke-current [&>svg]:stroke-2"
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
          class="category-select h-9 min-w-[220px] rounded-lg border border-slate-300 bg-white px-3 text-[var(--text-size-body)] text-slate-900 mobile:w-full mobile:flex-1"
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

    <div v-if="renderError" class="swagger-error mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-red-800 [&>p]:m-0 [&>p]:break-words [&>p]:leading-normal [&>strong]:mb-1.5 [&>strong]:block">
      <strong>{{ t("swagger.renderError") }}</strong>
      <p>{{ renderError }}</p>
    </div>

    <div ref="swaggerRoot" class="swagger-root min-h-[calc(var(--app-height,100vh)-72px)] bg-white mobile:min-h-[calc(var(--app-height,100vh)-132px)]"></div>
  </div>
</template>

<script setup>
/**
 * @file views/SwaggerPage.vue
 * @description 라우터가 직접 렌더하는 페이지 진입 컴포넌트입니다. 대부분 실제 로직은 container에 위임합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {useI18n} from "vue-i18n";

const {t} = useI18n();
import {nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import {RouterLink} from "vue-router";
import {BRIDGE_CATEGORY} from "@/platform/bridge/bridgeConstants";
import {
  generateOpenApi,
  getOpenApiCategoryOptions,
} from "@/platform/bridge/swagger/openapi";
import {
  installSwaggerRuntime,
  uninstallSwaggerRuntime,
} from "@/platform/bridge/swagger/swaggerRuntime";
import {installViewportCssVars} from "@/platform/viewport/viewportCssVars";
import {logError} from "@/utils/logger";

let swaggerInstance = null;

const swaggerRoot = ref(null);
const renderError = ref("");
const categoryOptions = getOpenApiCategoryOptions();
const selectedCategory = ref(BRIDGE_CATEGORY.ALL);
/**
 * 이 모듈 내부의 세부 처리 단계입니다. 호출부에서 의미가 드러나지 않는 중간 로직을 캡슐화합니다.
 */
function clearSwaggerRoot() {
  if (swaggerRoot.value) {
    swaggerRoot.value.innerHTML = "";
  }
}
const renderSwagger = async () => {
  renderError.value = "";

  try {
    installViewportCssVars();
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
  installViewportCssVars();
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

<style scoped lang="scss">
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
</style>
