<template>
  <div class="swagger-wrapper">
    <div id="swagger-ui"></div>
  </div>
</template>

<script setup>
import {onMounted} from "vue";
import SwaggerUI from "swagger-ui-dist/swagger-ui-es-bundle";
import "swagger-ui-dist/swagger-ui.css";

import {generateOpenApi} from "@/bridge/openapi";
import {callNative} from "@/bridge/callNative";

onMounted(() => {
  const spec = generateOpenApi();

  SwaggerUI({
    spec,
    dom_id: "#swagger-ui",

    // 🔥 핵심
    requestInterceptor: async (req) => {
      try {
        // /bridge/get_user → GET_USER
        const type = req.url.split("/").pop().toUpperCase();

        const payload = req.body ? JSON.parse(req.body) : {};

        const result = await callNative(type, payload);

        // Swagger에 결과 주입
        return {
          ...req,
          loadSpec: false,
          response: {
            status: 200,
            data: result,
          },
        };
      } catch (e) {
        return {
          ...req,
          response: {
            status: 500,
            data: {error: e.message},
          },
        };
      }
    },
  });
});
</script>

<style scoped>
.swagger-wrapper {
  height: 100vh;
  overflow-y: auto;
}

#swagger-ui {
  min-height: 100%;
}
</style>
