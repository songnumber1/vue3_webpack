<template>
  <div id="swagger-ui"></div>
</template>

<script setup>
import {onMounted} from "vue";
import SwaggerUI from "swagger-ui-dist/swagger-ui-es-bundle";
import "swagger-ui-dist/swagger-ui.css";

import {generateOpenApi} from "@/bridge/openapi";

onMounted(() => {
  const spec = generateOpenApi();

  SwaggerUI({
    spec,
    dom_id: "#swagger-ui",
  });
});
</script>
