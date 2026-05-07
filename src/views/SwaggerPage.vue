<template>
  <div class="swagger-page">
    <div class="swagger-toolbar">
      <div>
        <strong>Contract Category</strong>
        <p>Swagger 화면에서 REST/Web API, JS → Android, Android → JS 명세를 전환합니다.</p>
      </div>

      <div class="toolbar-actions">
        <RouterLink class="toolbar-link" to="/" title="홈으로 이동" aria-label="홈으로 이동">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 10.5 12 4l8 6.5V20a.5.5 0 0 1-.5.5h-5v-6h-5v6h-5A.5.5 0 0 1 4 20v-9.5Z"/>
          </svg>
          홈
        </RouterLink>
        <RouterLink class="toolbar-link" to="/bridge" title="실제 호출 테스트" aria-label="실제 호출 테스트">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 3.5v5.2L4.6 17a2.5 2.5 0 0 0 2.2 3.7h10.4a2.5 2.5 0 0 0 2.2-3.7L15 8.7V3.5"/>
            <path d="M8 3.5h8"/>
            <path d="M7.2 15.5h9.6"/>
          </svg>
          테스트
        </RouterLink>
        <select v-model="selectedCategory" class="category-select" @change="renderSwagger">
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

    <div id="swagger-ui" :key="selectedCategory"></div>
  </div>
</template>

<script setup>
import {nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import {RouterLink} from "vue-router";
import SwaggerUI from "swagger-ui-dist/swagger-ui-es-bundle";
import "swagger-ui-dist/swagger-ui.css";

import {
  ANDROID_TO_JS_PATH,
  BRIDGE_CATEGORY,
  JS_TO_ANDROID_PATH,
  WEB_API_PATH,
} from "@/bridge/bridgeConstants";
import {executeContract} from "@/bridge/bridgeClient";
import {generateOpenApi, getOpenApiCategoryOptions} from "@/bridge/openapi";

let originalFetch = null;
let swaggerInstance = null;

const categoryOptions = getOpenApiCategoryOptions();
const selectedCategory = ref(BRIDGE_CATEGORY.ALL);

const getRequestUrl = (input) => {
  return typeof input === "string" ? input : input?.url || "";
};

const parsePayload = async (input, init = {}) => {
  const body = init?.body;

  if (typeof body === "string") {
    return body ? JSON.parse(body) : {};
  }

  if (body instanceof Blob) {
    const text = await body.text();
    return text ? JSON.parse(text) : {};
  }

  if (input instanceof Request) {
    const text = await input.clone().text();
    return text ? JSON.parse(text) : {};
  }

  return {};
};

const toContractType = (url) => {
  return url.split("/").pop().toUpperCase();
};

const resolveCategoryFromUrl = (url) => {
  if (url.includes(JS_TO_ANDROID_PATH)) return BRIDGE_CATEGORY.JS_TO_ANDROID;
  if (url.includes(ANDROID_TO_JS_PATH)) return BRIDGE_CATEGORY.ANDROID_TO_JS;
  if (url.includes(WEB_API_PATH)) return BRIDGE_CATEGORY.WEB_API;
  return null;
};

const createJsonResponse = (body, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "Contract Error",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

const createFallbackError = (error) => {
  const now = new Date().toISOString();

  return {
    requestId: "swagger_error",
    requestDate: now,
    responseDate: now,
    isSuccess: false,
    code: "CONTRACT_ERROR",
    data: null,
    message: error?.message || "Contract execution failed",
    meta: {},
    error: {
      type: "CONTRACT_ERROR",
      detail: error?.message || "Contract execution failed",
    },
  };
};

const installFetchInterceptor = () => {
  if (originalFetch) return;

  originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    try {
      const url = getRequestUrl(input);
      const category = resolveCategoryFromUrl(url);

      if (category) {
        const type = toContractType(url);
        const payload = await parsePayload(input, init);
        const result = await executeContract(category, type, payload);

        return createJsonResponse(result, 200);
      }

      return originalFetch(input, init);
    } catch (error) {
      return createJsonResponse(error?.response || createFallbackError(error), 400);
    }
  };
};

const renderSwagger = async () => {
  const spec = generateOpenApi(selectedCategory.value);

  await nextTick();

  const target = document.querySelector("#swagger-ui");
  if (target) target.innerHTML = "";

  swaggerInstance = SwaggerUI({
    spec,
    dom_id: "#swagger-ui",
    deepLinking: true,
    displayRequestDuration: true,
    docExpansion: "list",
    defaultModelsExpandDepth: 2,
  });
};

onMounted(() => {
  installFetchInterceptor();
  renderSwagger();
});

onBeforeUnmount(() => {
  swaggerInstance = null;

  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
});
</script>

<style scoped>
.swagger-page {
  height: 100dvh;
  overflow: auto;
  background: #ffffff;
}

.swagger-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
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
  transition: background 160ms ease, transform 160ms ease, border-color 160ms ease;
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


:deep(.curl),
:deep(.request-url) {
  display: none !important;
}

@media (max-width: 640px) {
  .swagger-toolbar {
    align-items: stretch;
    flex-direction: column;
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
}
</style>
