<template>
  <div class="layout">
    <BridgePanel />

    <div class="swagger-area">
      <div id="swagger-ui"></div>
    </div>
  </div>
</template>

<script setup>
import {onBeforeUnmount, onMounted} from "vue";
import SwaggerUI from "swagger-ui-dist/swagger-ui-es-bundle";
import "swagger-ui-dist/swagger-ui.css";

import BridgePanel from "@/components/bridge/BridgePanel.vue";

import {BRIDGE_PATH} from "@/bridge/bridgeConstants";
import {callNative} from "@/bridge/bridgeClient";
import {generateOpenApi} from "@/bridge/openapi";

let originalFetch = null;
let urlObserver = null;
let cleanTimer = null;

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

const toBridgeType = (url) => {
  return url.split("/").pop().toUpperCase();
};

const createJsonResponse = (body, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    statusText: status >= 200 && status < 300 ? "OK" : "Bridge Error",
    headers: {
      "Content-Type": "application/json",
    },
  });
};

const cleanSwaggerUrls = () => {
  document.querySelectorAll(".request-url").forEach((el) => {
    const full = el.textContent.trim();

    try {
      const path = new URL(full).pathname;

      if (full !== path) {
        el.textContent = path;
      }
    } catch (error) {
      // URL이 아직 완성되지 않은 렌더링 중간 상태는 무시한다.
    }
  });

  document.querySelectorAll(".curl").forEach((el) => {
    const next = el.textContent.replace(/https?:\/\/[^/\s]+/g, "");

    if (el.textContent !== next) {
      el.textContent = next;
    }
  });
};

const scheduleCleanSwaggerUrls = () => {
  if (cleanTimer) return;

  cleanTimer = window.setTimeout(() => {
    cleanTimer = null;
    cleanSwaggerUrls();
  }, 100);
};

onMounted(() => {
  const spec = generateOpenApi();

  originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    try {
      const url = getRequestUrl(input);

      if (url.includes(BRIDGE_PATH)) {
        const type = toBridgeType(url);
        const payload = await parsePayload(input, init);
        const result = await callNative(type, payload);

        return createJsonResponse(
          result.success ? result.data : {success: false, error: result.error},
          result.success ? 200 : 400
        );
      }

      return originalFetch(input, init);
    } catch (error) {
      return createJsonResponse(
        {
          success: false,
          error: error.message,
        },
        500
      );
    }
  };

  SwaggerUI({
    spec,
    dom_id: "#swagger-ui",
    deepLinking: true,
    displayRequestDuration: true,
    docExpansion: "list",
    defaultModelsExpandDepth: 2,
    onComplete: () => {
      scheduleCleanSwaggerUrls();

      const target = document.getElementById("swagger-ui");

      if (!target) return;

      urlObserver = new MutationObserver(() => {
        scheduleCleanSwaggerUrls();
      });

      urlObserver.observe(target, {
        childList: true,
        subtree: true,
      });
    },
  });
});

onBeforeUnmount(() => {
  if (originalFetch) {
    window.fetch = originalFetch;
  }

  if (urlObserver) {
    urlObserver.disconnect();
    urlObserver = null;
  }

  if (cleanTimer) {
    window.clearTimeout(cleanTimer);
    cleanTimer = null;
  }
});
</script>

<style scoped>
.layout {
  display: flex;
  height: 100dvh;
  min-height: 0;
  background: #ffffff;
}

.swagger-area {
  flex: 1;
  min-width: 0;
  overflow: auto;
}
</style>
