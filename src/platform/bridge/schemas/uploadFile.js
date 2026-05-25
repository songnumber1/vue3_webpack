/**
 * @file platform/bridge/schemas/uploadFile.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {z} from "../zod";
import {BaseRequest, createResponseSchema} from "./base";

export const UploadFileRequest = BaseRequest.extend({
  fileName: z.string().openapi({
    description: "파일명",
    example: "test.png",
  }),
  fileSize: z.number().openapi({
    description: "파일 크기(byte)",
    example: 1024,
  }),
});

export const UploadFileData = z.object({
  url: z.string().openapi({
    description: "업로드된 파일 URL",
    example: "https://mock.local/files/test.png",
  }),
});

export const UploadFileResponse = createResponseSchema(UploadFileData);
