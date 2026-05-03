// src/bridge/openapi.js
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";

import {BridgeContract} from "./contract";

export function generateOpenApi() {
  const registry = new OpenAPIRegistry();

  Object.entries(BridgeContract).forEach(([type, contract]) => {
    const requestName = `${type}Request`;
    const responseName = `${type}Response`;

    registry.register(requestName, contract.request);
    registry.register(responseName, contract.response);

    registry.registerPath({
      method: "post",
      path: `/bridge/${type.toLowerCase()}`,
      description: contract.description || type,
      tags: [contract.tag || "Default"],
      request: {
        body: {
          content: {
            "application/json": {
              schema: {$ref: `#/components/schemas/${requestName}`},
            },
          },
        },
      },
      responses: {
        200: {
          description: "성공",
          content: {
            "application/json": {
              schema: {$ref: `#/components/schemas/${responseName}`},
            },
          },
        },
      },
    });
  });

  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Bridge 테스트 UI API",
      version: "2.3.1",
      description: "Android ↔ Web Bridge API 문서",
    },
    tags: [
      {name: "User", description: "유저 관련 API"},
      {name: "Auth", description: "인증 관련 API"},
      {name: "File", description: "파일 관련 API"},
    ],
  });
}
