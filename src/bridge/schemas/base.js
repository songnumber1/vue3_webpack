/**
 * @file base.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import {z} from "../zod";

export const BaseRequest = z.object({
  requestId: z.string().min(1).openapi({
    description: "요청 추적 ID",
    example: "req_20260507_001",
  }),
  requestDate: z.string().datetime({offset: true}).openapi({
    description: "요청 생성 일시(ISO-8601)",
    example: "2026-05-07T07:00:00.000Z",
  }),
});

export const BaseResponseMeta = z.record(z.any()).openapi({
  description: "응답 부가 정보",
  example: {
    platform: "android",
  },
});

export const BaseResponse = BaseRequest.extend({
  responseDate: z.string().datetime({offset: true}).openapi({
    description: "응답 생성 일시(ISO-8601)",
    example: "2026-05-07T07:00:01.000Z",
  }),
  isSuccess: z.boolean().openapi({
    description: "성공 여부",
    example: true,
  }),
  code: z.string().openapi({
    description: "응답 코드",
    example: "SUCCESS",
  }),
  data: z.any().openapi({
    description: "응답 데이터",
  }),
  message: z.string().openapi({
    description: "응답 메시지",
    example: "정상 처리되었습니다.",
  }),
  meta: BaseResponseMeta.optional(),
});

export const BridgeErrorDetail = z.object({
  type: z.string().openapi({
    description: "오류 유형",
    example: "VALIDATION_ERROR",
  }),
  detail: z.string().openapi({
    description: "오류 상세 메시지",
    example: "Invalid request payload: GET_USER",
  }),
});

export const BaseResponseError = BaseResponse.extend({
  isSuccess: z.literal(false).openapi({
    description: "성공 여부",
    example: false,
  }),
  code: z.string().openapi({
    description: "오류 코드",
    example: "BRIDGE_ERROR",
  }),
  data: z.null().openapi({
    description: "오류 응답에서는 null",
    example: null,
  }),
  message: z.string().openapi({
    description: "오류 메시지",
    example: "Bridge 요청 처리 중 오류가 발생했습니다.",
  }),
  error: BridgeErrorDetail.openapi({
    description: "공통 Bridge 오류 정보",
  }),
});

/**
 * createResponseSchema 함수입니다.
 * @param {*} dataSchema 함수 실행에 필요한 값입니다.
 * @returns {*} 처리 결과를 반환합니다.
 */
export function createResponseSchema(dataSchema) {
  return BaseResponse.extend({
    isSuccess: z.literal(true).openapi({
      description: "성공 여부",
      example: true,
    }),
    code: z.string().default("SUCCESS").openapi({
      description: "응답 코드",
      example: "SUCCESS",
    }),
    data: dataSchema,
  });
}
