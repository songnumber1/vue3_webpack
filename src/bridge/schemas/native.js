/**
 * @file native.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import { z } from "../zod";
import { BaseRequest, createResponseSchema } from "./base";

export const EmptyNativeRequest = BaseRequest.extend({});
export const BooleanAckData = z.object({
  ok: z.boolean().openapi({ description: "처리 성공 여부", example: true }),
});
export const BooleanAckResponse = createResponseSchema(BooleanAckData);

export const OpenExternalBrowserRequest = BaseRequest.extend({
  url: z.string().url().openapi({
    description: "외부 브라우저로 열 URL",
    example: "https://example.com",
  }),
});
export const OpenExternalBrowserResponse = createResponseSchema(
  z.object({
    opened: z
      .boolean()
      .openapi({ description: "외부 브라우저 실행 여부", example: true }),
  }),
);

export const FilePickerOptions = z.object({
  source: z
    .enum(["camera", "image", "file", "all"])
    .default("all")
    .openapi({ description: "파일 선택 출처", example: "all" }),
  multiple: z
    .boolean()
    .optional()
    .openapi({ description: "다중 선택 여부", example: true }),
  accept: z
    .string()
    .optional()
    .openapi({ description: "허용 MIME", example: "image/*" }),
});
export const OpenFilePickerRequest = BaseRequest.extend({
  options: FilePickerOptions.optional(),
});
export const OpenFilePickerResponse = createResponseSchema(
  z.object({
    opened: z
      .boolean()
      .openapi({ description: "파일 선택 UI 실행 여부", example: true }),
    requestId: z.string().optional().openapi({
      description: "결과 매칭용 요청 ID",
      example: "req_20260507_001",
    }),
  }),
);

export const GetAppVersionData = z.object({
  platform: z
    .string()
    .openapi({ description: "네이티브 플랫폼", example: "android" }),
  appVersion: z.string().openapi({ description: "앱 버전", example: "1.0.0" }),
  buildNumber: z
    .string()
    .optional()
    .openapi({ description: "빌드 번호", example: "100" }),
  bridgeVersion: z
    .string()
    .optional()
    .openapi({ description: "브릿지 버전", example: "1.0.0" }),
});
export const GetAppVersionResponse = createResponseSchema(GetAppVersionData);
export const GetPushTokenData = z.object({
  token: z
    .string()
    .openapi({ description: "FCM 푸시 토큰", example: "mock-push-token" }),
});
export const GetPushTokenResponse = createResponseSchema(GetPushTokenData);
export const CopyClipboardRequest = BaseRequest.extend({
  text: z
    .string()
    .min(1)
    .openapi({
      description: "클립보드에 복사할 텍스트",
      example: "복사할 내용",
    }),
});
export const CopyClipboardData = z.object({
  copied: z.boolean().openapi({ description: "복사 성공 여부", example: true }),
});
export const CopyClipboardResponse = createResponseSchema(CopyClipboardData);

export const ShareRequest = BaseRequest.extend({
  data: z
    .object({
      title: z.string().optional(),
      text: z.string().optional(),
      url: z.string().optional(),
    })
    .openapi({
      description: "시스템 공유 데이터",
      example: { title: "제목", text: "공유 내용", url: "https://example.com" },
    }),
});
export const ShareResponse = createResponseSchema(
  z.object({
    shared: z
      .boolean()
      .openapi({ description: "공유창 실행 여부", example: true }),
  }),
);
export const CheckNetworkResponse = createResponseSchema(
  z.object({
    online: z
      .boolean()
      .openapi({ description: "네트워크 연결 여부", example: true }),
    type: z
      .string()
      .optional()
      .openapi({ description: "네트워크 유형", example: "wifi" }),
    metered: z
      .boolean()
      .optional()
      .openapi({ description: "종량제 네트워크 여부", example: false }),
  }),
);
export const StorageGetRequest = BaseRequest.extend({
  key: z
    .string()
    .min(1)
    .openapi({ description: "secure storage key", example: "accessToken" }),
});
export const StorageGetResponse = createResponseSchema(
  z.object({
    key: z.string(),
    value: z
      .string()
      .nullable()
      .openapi({ description: "저장값", example: "token-value" }),
  }),
);
export const StorageSetRequest = BaseRequest.extend({
  key: z.string().min(1),
  value: z
    .string()
    .openapi({ description: "저장할 값", example: "token-value" }),
});
export const StorageSetResponse = createResponseSchema(
  z.object({
    key: z.string(),
    saved: z
      .boolean()
      .openapi({ description: "저장 성공 여부", example: true }),
  }),
);
export const StorageRemoveRequest = BaseRequest.extend({
  key: z.string().min(1).openapi({
    description: "삭제할 secure storage key",
    example: "accessToken",
  }),
});
export const StorageRemoveResponse = createResponseSchema(
  z.object({
    key: z.string(),
    removed: z
      .boolean()
      .openapi({ description: "삭제 성공 여부", example: true }),
  }),
);
export const CancelRequestRequest = BaseRequest.extend({
  id: z
    .string()
    .min(1)
    .openapi({ description: "취소할 요청 ID", example: "upload_001" }),
});
export const CancelRequestResponse = createResponseSchema(
  z.object({
    id: z.string(),
    cancelled: z.boolean().openapi({ description: "취소 여부", example: true }),
  }),
);
export const SetBackHandlerRequest = BaseRequest.extend({
  enable: z
    .boolean()
    .openapi({ description: "웹 백버튼 제어 활성화 여부", example: true }),
});
export const SetBackHandlerResponse = createResponseSchema(
  z.object({
    enabled: z.boolean().openapi({ description: "설정 결과", example: true }),
  }),
);
export const ShowToastRequest = BaseRequest.extend({
  message: z
    .string()
    .min(1)
    .openapi({ description: "토스트 메시지", example: "저장되었습니다." }),
});
export const ShowToastResponse = createResponseSchema(
  z.object({
    shown: z.boolean().openapi({ description: "표시 여부", example: true }),
  }),
);
export const GetDeviceInfoResponse = createResponseSchema(
  z.object({
    os: z.string().openapi({ description: "OS", example: "android" }),
    osVersion: z
      .string()
      .optional()
      .openapi({ description: "OS 버전", example: "14" }),
    model: z
      .string()
      .optional()
      .openapi({ description: "디바이스 모델", example: "SM-S918N" }),
    manufacturer: z
      .string()
      .optional()
      .openapi({ description: "제조사", example: "Samsung" }),
    appVersion: z
      .string()
      .optional()
      .openapi({ description: "앱 버전", example: "1.0.0" }),
    bridgeVersion: z
      .string()
      .optional()
      .openapi({ description: "브릿지 버전", example: "1.0.0" }),
  }),
);
export const WriteLogRequest = BaseRequest.extend({
  data: z.record(z.any()).openapi({
    description: "네이티브 로그 데이터",
    example: { level: "info", message: "upload started" },
  }),
});
export const WriteLogResponse = createResponseSchema(
  z.object({
    written: z
      .boolean()
      .openapi({ description: "로그 저장 여부", example: true }),
  }),
);
export const CloseAppResponse = createResponseSchema(
  z.object({
    closed: z
      .boolean()
      .openapi({ description: "앱 종료 요청 처리 여부", example: true }),
  }),
);
