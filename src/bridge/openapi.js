import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";

import {BridgeContract} from "./contract";
import {BRIDGE_PATH} from "./bridgeConstants";
import {BaseRequest, BaseResponse, BaseResponseError} from "./schemas/base";

function createErrorResponse(description, schema) {
  return {
    description,
    content: {
      "application/json": {
        schema,
      },
    },
  };
}

export function generateOpenApi() {
  const registry = new OpenAPIRegistry();

  registry.register("BaseRequest", BaseRequest);
  registry.register("BaseResponse", BaseResponse);
  registry.register("BaseErrorResponse", BaseResponseError);

  Object.entries(BridgeContract).forEach(([type, contract]) => {
    registry.register(`${type}_Request`, contract.request);
    registry.register(`${type}_Response`, contract.response);

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
        400: createErrorResponse("Bridge 요청 오류", contract.error),
        401: createErrorResponse("Bridge 인증 오류", contract.error),
        500: createErrorResponse("Bridge 서버 오류", contract.error),
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
- 요청/응답/오류 응답은 Zod Contract 기준으로 검증됩니다.
- 모든 요청은 BaseRequest(requestId, requestDate)를 기본으로 포함합니다.
- 모든 응답은 BaseResponse(requestId, requestDate, responseDate, isSuccess, code, data, message, meta)를 기본으로 포함합니다.
- 모든 오류 응답은 BridgeErrorResponse를 공통으로 사용하고 error 키를 포함합니다.
      `,
    },
    tags: [
      {name: "User", description: "유저 관련 Bridge"},
      {name: "Auth", description: "인증 관련 Bridge"},
      {name: "File", description: "파일 관련 Bridge"},
    ],
  });
}
