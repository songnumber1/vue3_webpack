<template>
  <div class="swagger-page">
    <div id="swagger-ui"></div>
  </div>
</template>

<script setup>
import {onBeforeUnmount, onMounted} from "vue";
import SwaggerUI from "swagger-ui-dist/swagger-ui-es-bundle";
import "swagger-ui-dist/swagger-ui.css";

import {BRIDGE_PATH} from "@/bridge/bridgeConstants";
import {callNative} from "@/bridge/bridgeClient";
import {generateOpenApi} from "@/bridge/openapi";

let originalFetch = null;

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

        return createJsonResponse(result.data, 200);
      }

      return originalFetch(input, init);
    } catch (error) {
      return createJsonResponse(
        {
          success: false,
          error: error.message,
        },
        400
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
  });
});

onBeforeUnmount(() => {
  if (originalFetch) {
    window.fetch = originalFetch;
  }
});
</script>

<style scoped>
.swagger-page {
  height: 100dvh;
  overflow: auto;
  background: #ffffff;
}
</style>
