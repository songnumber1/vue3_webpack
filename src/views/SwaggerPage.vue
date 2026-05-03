<template>
  <div class="layout">
    <BridgePanel />

    <div class="swagger-area">
      <div id="swagger-ui"></div>
    </div>
  </div>
</template>

<script setup>
import {onMounted, onBeforeUnmount} from "vue";
import SwaggerUI from "swagger-ui-dist/swagger-ui-es-bundle";
import "swagger-ui-dist/swagger-ui.css";

import BridgePanel from "@/components/bridge/BridgePanel.vue";

import {generateOpenApi} from "@/bridge/openapi";
import {callNative} from "@/bridge/bridgeClient";
import {BRIDGE_PATH} from "@/bridge/bridgeConstants";

let originalFetch = null;

onMounted(() => {
  const spec = generateOpenApi();

  originalFetch = window.fetch;

  window.fetch = async (input, init = {}) => {
    try {
      const url = typeof input === "string" ? input : input?.url || "";

      if (url.includes(BRIDGE_PATH)) {
        const type = url.split("/").pop().toUpperCase();

        let payload = {};

        if (init?.body) {
          payload = JSON.parse(init.body);
        } else if (input instanceof Request) {
          const text = await input.clone().text();
          payload = text ? JSON.parse(text) : {};
        }

        const result = await callNative(type, payload);

        return new Response(
          JSON.stringify(
            result.success ? result.data : {success: false, error: result.error}
          ),
          {
            status: result.success ? 200 : 400,
            headers: {"Content-Type": "application/json"},
          }
        );
      }

      return originalFetch(input, init);
    } catch (e) {
      return new Response(
        JSON.stringify({
          success: false,
          error: e.message,
        }),
        {
          status: 500,
          headers: {"Content-Type": "application/json"},
        }
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
.layout {
  display: flex;
  height: 100dvh;
}

.swagger-area {
  flex: 1;
  overflow: auto;
}
</style>
