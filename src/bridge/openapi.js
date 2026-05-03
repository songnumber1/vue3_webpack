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
      title: "My Custom Bridge API",
      version: "2.3.1",
      description: "Android ↔ Web Bridge API 문서",
    },
    servers: [
      {
        url: "http://localhost:8080",
        description: "Local Dev",
      },
    ],
  });
}
