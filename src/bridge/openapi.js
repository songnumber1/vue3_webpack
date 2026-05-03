import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";

import {z} from "./zod";
import {BridgeContract} from "./contract";
import {BRIDGE_PATH} from "./bridgeConstants";

const BridgeErrorResponse = z.object({
  success: z.boolean().openapi({
    description: "성공 여부",
    example: false,
  }),
  error: z.string().openapi({
    description: "오류 메시지",
    example: "Invalid request payload: GET_USER",
  }),
});

export function generateOpenApi() {
  const registry = new OpenAPIRegistry();

  registry.register("BridgeErrorResponse", BridgeErrorResponse);

  Object.entries(BridgeContract).forEach(([type, contract]) => {
    registry.register(`${type}Request`, contract.request);
    registry.register(`${type}Response`, contract.response);

    registry.registerPath({
      method: "post",
      path: `${BRIDGE_PATH}${type.toLowerCase()}`,
      description: `[Bridge] ${contract.description || type}`,
      tags: [contract.tag || "Default"],
      request: {
        body: {
          content: {
            "application/json": {
              schema: contract.request,
            },
          },
        },
      },
      responses: {
        200: {
          description: "성공",
          content: {
            "application/json": {
              schema: contract.response,
            },
          },
        },
        400: {
          description: "Bridge 오류",
          content: {
            "application/json": {
              schema: BridgeErrorResponse,
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
      version: "1.0.0",
      description: `
이 문서는 HTTP 서버 API가 아니라 Android ↔ Web Native Bridge 테스트 문서입니다.

- Swagger UI는 Bridge 요청 테스트 입력 UI로 사용합니다.
- 실제 호출은 fetch override를 통해 AndroidBridge로 전달됩니다.
- AndroidBridge가 없는 일반 브라우저에서는 mock 응답으로 테스트됩니다.
- 요청/응답은 Zod Contract 기준으로 검증됩니다.
      `,
    },
    tags: [
      {name: "User", description: "유저 관련 Bridge"},
      {name: "Auth", description: "인증 관련 Bridge"},
      {name: "File", description: "파일 관련 Bridge"},
    ],
  });
}
