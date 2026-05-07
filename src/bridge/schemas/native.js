import {z} from "../zod";
import {BaseRequest, createResponseSchema} from "./base";

export const EmptyNativeRequest = BaseRequest.extend({});

export const GetAppVersionData = z.object({
  platform: z.string().openapi({
    description: "네이티브 플랫폼",
    example: "android",
  }),
  appVersion: z.string().openapi({
    description: "앱 버전",
    example: "1.0.0",
  }),
  buildNumber: z.string().optional().openapi({
    description: "빌드 번호",
    example: "100",
  }),
});

export const GetAppVersionResponse = createResponseSchema(GetAppVersionData);

export const GetPushTokenData = z.object({
  token: z.string().openapi({
    description: "푸시 토큰",
    example: "mock-push-token",
  }),
});

export const GetPushTokenResponse = createResponseSchema(GetPushTokenData);

export const CopyClipboardRequest = BaseRequest.extend({
  text: z.string().min(1).openapi({
    description: "클립보드에 복사할 텍스트",
    example: "복사할 내용",
  }),
});

export const CopyClipboardData = z.object({
  copied: z.boolean().openapi({
    description: "복사 성공 여부",
    example: true,
  }),
});

export const CopyClipboardResponse = createResponseSchema(CopyClipboardData);
