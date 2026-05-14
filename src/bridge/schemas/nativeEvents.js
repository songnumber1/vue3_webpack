/**
 * @file nativeEvents.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import { z } from "../zod";
import { BaseRequest, createResponseSchema } from "./base";
export const NativeEventAckData = z.object({
  handled: z.boolean().openapi({ description: "JS 수신 여부", example: true }),
  eventName: z
    .string()
    .openapi({ description: "수신 이벤트명", example: "ON_APP_RESUME" }),
});
export const NativeEventAckResponse = createResponseSchema(NativeEventAckData);
export const OnAppResumeRequest = BaseRequest.extend({
  source: z
    .string()
    .optional()
    .openapi({ description: "이벤트 발생 주체", example: "android" }),
});
export const OnAppPauseRequest = BaseRequest.extend({
  reason: z
    .string()
    .optional()
    .openapi({ description: "백그라운드 진입 사유", example: "home" }),
});
export const OnBackPressedRequest = BaseRequest.extend({
  canGoBack: z
    .boolean()
    .optional()
    .openapi({ description: "WebView history back 가능 여부", example: true }),
});
export const NativeSelectedFile = z.object({
  name: z.string().openapi({ description: "파일명", example: "image.jpg" }),
  uri: z
    .string()
    .openapi({
      description: "네이티브 파일 URI",
      example: "content://media/1",
    }),
  type: z
    .string()
    .optional()
    .openapi({ description: "MIME", example: "image/jpeg" }),
  size: z
    .number()
    .optional()
    .openapi({ description: "파일 크기", example: 12345 }),
});
export const OnFileSelectedRequest = BaseRequest.extend({
  files: z
    .array(NativeSelectedFile)
    .openapi({ description: "선택된 파일 목록" }),
  pickerRequestId: z.string().optional().openapi({
    description: "openFilePicker 요청 ID",
    example: "req_20260507_001",
  }),
});
export const OnNetworkChangeRequest = BaseRequest.extend({
  status: z
    .object({
      online: z.boolean(),
      type: z.string().optional(),
      metered: z.boolean().optional(),
    })
    .openapi({
      description: "네트워크 상태",
      example: { online: true, type: "wifi", metered: false },
    }),
});
export const OnPushClickRequest = BaseRequest.extend({
  notificationId: z
    .string()
    .openapi({ description: "푸시 알림 ID", example: "notice-1000" }),
  route: z
    .string()
    .optional()
    .openapi({ description: "이동 경로", example: "/notice/1000" }),
  payload: z
    .record(z.any())
    .optional()
    .openapi({
      description: "부가 데이터",
      example: { type: "notice", id: "1000" },
    }),
});
export const OnSessionExpiredRequest = BaseRequest.extend({
  reason: z
    .string()
    .optional()
    .openapi({ description: "만료 사유", example: "token_expired" }),
});
export const OnWebViewCloseRequest = BaseRequest.extend({
  reason: z
    .string()
    .optional()
    .openapi({ description: "종료 사유", example: "app_close" }),
});
export const OnRequestCancelRequest = BaseRequest.extend({
  id: z
    .string()
    .openapi({ description: "취소 요청 ID", example: "upload_001" }),
});
export const OnNativeErrorRequest = BaseRequest.extend({
  error: z
    .object({
      code: z
        .string()
        .openapi({ description: "오류 코드", example: "FILE_PICKER_ERROR" }),
      message: z
        .string()
        .openapi({ description: "오류 메시지", example: "파일 선택 실패" }),
      detail: z.any().optional(),
    })
    .openapi({ description: "네이티브 오류 정보" }),
});
