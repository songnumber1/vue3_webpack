/**
 * @file platform/bridge/schemas/getUser.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {z} from "../zod";
import {BaseRequest, createResponseSchema} from "./base";

export const GetUserRequest = BaseRequest.extend({
  id: z.number().openapi({
    description: "유저 ID",
    example: 1,
  }),
});

export const GetUserData = z.object({
  id: z.number().openapi({
    description: "유저 ID",
    example: 1,
  }),
  name: z.string().openapi({
    description: "유저 이름",
    example: "홍길동",
  }),
});

export const GetUserResponse = createResponseSchema(GetUserData);
