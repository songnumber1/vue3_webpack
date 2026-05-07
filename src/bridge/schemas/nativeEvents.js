import {z} from "../zod";
import {BaseRequest, createResponseSchema} from "./base";

export const NativeEventAckData = z.object({
  handled: z.boolean().openapi({
    description: "JS에서 이벤트를 정상 수신했는지 여부",
    example: true,
  }),
  eventName: z.string().openapi({
    description: "수신한 Android → JS 이벤트명",
    example: "ON_APP_RESUME",
  }),
});

export const NativeEventAckResponse = createResponseSchema(NativeEventAckData);

export const OnAppResumeRequest = BaseRequest.extend({
  source: z.string().optional().openapi({
    description: "이벤트 발생 주체",
    example: "android",
  }),
});

export const OnBackPressedRequest = BaseRequest.extend({
  canGoBack: z.boolean().optional().openapi({
    description: "Android 측 WebView history back 가능 여부",
    example: true,
  }),
});

export const OnPushClickRequest = BaseRequest.extend({
  notificationId: z.string().openapi({
    description: "푸시 알림 ID",
    example: "notice-1000",
  }),
  route: z.string().optional().openapi({
    description: "JS 라우터 이동 경로",
    example: "/notice/1000",
  }),
  payload: z.record(z.any()).optional().openapi({
    description: "푸시 클릭 부가 데이터",
    example: {
      type: "notice",
      id: "1000",
    },
  }),
});
