import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";

import {BridgeContract} from "./contract";
import {BRIDGE_PATH} from "./bridgeConstants";

export function generateOpenApi() {
  const registry = new OpenAPIRegistry();

  Object.entries(BridgeContract).forEach(([type, contract]) => {
    const requestName = `${type}Request`;
    const responseName = `${type}Response`;

    registry.register(requestName, contract.request);
    registry.register(responseName, contract.response);

    registry.registerPath({
      method: "post",

      // 🔥 상수 사용
      path: `${BRIDGE_PATH}${type.toLowerCase()}`,

      description: `[Bridge] ${contract.description}`,
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
      description: `
🚨 이 API는 HTTP 서버가 아닙니다.
Native Bridge 테스트용 UI입니다.
`,
    },
    tags: [
      {name: "User", description: "유저 관련 API"},
      {name: "Auth", description: "인증 관련 API"},
      {name: "File", description: "파일 관련 API"},
    ],
  });
}
