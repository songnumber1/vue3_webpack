import {
  // 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";

import {getContractsByCategory} from "./contract";
import {
  ANDROID_TO_JS_PATH,
  BRIDGE_CATEGORY,
  JS_TO_ANDROID_PATH,
  WEB_API_PATH,
} from "./bridgeConstants";
import {BaseRequest, BaseResponse, BaseResponseError} from "./schemas/base";

const CATEGORY_OPTIONS = [
  {
    value: BRIDGE_CATEGORY.ALL,
    label: "전체",
    description: "REST/Web API, JS → Android, Android → JS contract 전체",
  },
  {
    value: BRIDGE_CATEGORY.WEB_API,
    label: "REST / Web API",
    description:
      "JS에서 실제 backend API를 호출하고 표준 응답으로 정규화하는 contract",
  },
  {
    value: BRIDGE_CATEGORY.JS_TO_ANDROID,
    label: "JS → Android",
    description: "JS가 Android Bridge에 네이티브 기능을 요청하는 contract",
  },
  {
    value: BRIDGE_CATEGORY.ANDROID_TO_JS,
    label: "Android → JS",
    description: "Android가 WebView 내부 JS 이벤트 핸들러를 호출하는 contract",
  },
];

/**
 * @description createErrorResponse 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} description - description 입력값입니다.
 * @param {*} schema - schema 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
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

/**
 * @description getCategoryPath 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} category - category 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getCategoryPath(category) {
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (category === BRIDGE_CATEGORY.JS_TO_ANDROID) return JS_TO_ANDROID_PATH;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (category === BRIDGE_CATEGORY.ANDROID_TO_JS) return ANDROID_TO_JS_PATH;

  return WEB_API_PATH;
}

/**
 * @description getCategoryDescription 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} category - category 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function getCategoryDescription(category) {
  return (
    CATEGORY_OPTIONS.find((option) => option.value === category)?.description ||
    "Bridge contract"
  );
}

/**
 * @description shouldIncludeContract 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} selectedCategory - selectedCategory 입력값입니다.
 * @param {*} contract - contract 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function shouldIncludeContract(selectedCategory, contract) {
  return (
    selectedCategory === BRIDGE_CATEGORY.ALL ||
    contract.category === selectedCategory
  );
}

/**
 * @description getOpenApiCategoryOptions 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function getOpenApiCategoryOptions() {
  return CATEGORY_OPTIONS;
}

/**
 * @description generateOpenApi 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} selectedCategory - selectedCategory 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
export function generateOpenApi(selectedCategory = BRIDGE_CATEGORY.ALL) {
  const registry = new OpenAPIRegistry();
  const allContracts = getContractsByCategory(BRIDGE_CATEGORY.ALL);

  registry.register("BaseRequest", BaseRequest);
  registry.register("BaseResponse", BaseResponse);
  registry.register("BridgeErrorResponse", BaseResponseError);

  Object.entries(allContracts)
    .filter(([, contract]) => shouldIncludeContract(selectedCategory, contract))
    .forEach(([type, contract]) => {
      const basePath = getCategoryPath(contract.category);
      const schemaPrefix = `${contract.category}_${type}`
        .replace(/-/g, "_")
        .toUpperCase();

      registry.register(`${schemaPrefix}_Request`, contract.request);
      registry.register(`${schemaPrefix}_Response`, contract.response);

      registry.registerPath({
        method: "post",
        path: `${basePath}${type.toLowerCase()}`,
        description: contract.description || type,
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
          400: createErrorResponse("요청 검증 오류", contract.error),
          401: createErrorResponse("인증 오류", contract.error),
          500: createErrorResponse("처리 오류", contract.error),
        },
      });
    });

  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Bridge / Web API Contract 문서",
      version: "1.1.0",
      description: `
이 문서는 HTTP 서버 Swagger만을 위한 문서가 아니라 WebView 기반 JS Runtime과 Android Bridge 간 contract를 함께 확인하고 실제 Runtime 호출을 검증하기 위한 문서입니다.

- 상단 카테고리에서 REST / Web API, JS → Android, Android → JS contract를 전환할 수 있습니다.
- REST / Web API는 JS에서 실제 backend API를 호출한 뒤 표준 응답으로 정규화하는 흐름입니다.
- JS → Android는 JS가 Android Bridge에 버전, 푸시 토큰, 클립보드 등 네이티브 기능을 요청하는 흐름입니다.
- Android → JS는 Android가 WebView의 JS 이벤트 핸들러를 실제 호출하는 contract입니다. Swagger/Web 화면에서는 성공 mock으로 처리하지 않고 Native dispatch가 필요함을 오류로 표시합니다.
- JS → Android는 AndroidBridge.postMessage 또는 직접 bridge method가 있을 때만 실제 Native로 전달됩니다. AndroidBridge가 없는 Windows/Web 브라우저에서는 성공 mock을 반환하지 않습니다.
- 실제 Android WebView에서는 AndroidBridge.postMessage 또는 직접 bridge method가 있으면 real bridge로 전달됩니다.
- 모든 요청은 BaseRequest(requestId, requestDate)를 기본으로 포함합니다.
- 모든 응답은 BaseResponse(requestId, requestDate, responseDate, isSuccess, code, data, message, meta)를 기본으로 포함합니다.
- 모든 오류 응답은 BridgeErrorResponse를 공통으로 사용하고 error 키를 포함합니다.

현재 선택 카테고리: ${getCategoryDescription(selectedCategory)}
      `,
    },
    tags: [
      {name: "REST / Web API", description: "JS 실제 backend API contract"},
      {
        name: "JS → Android",
        description: "JS에서 Android Native Bridge로 요청하는 contract",
      },
      {
        name: "Android → JS",
        description: "Android에서 WebView JS로 전달하는 이벤트 contract",
      },
    ],
  });
}
