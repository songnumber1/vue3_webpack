/**
 * @file platform/bridge/schemas/login.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 */

import {z} from "../zod";
import {BaseRequest, createResponseSchema} from "./base";

export const LoginRequest = BaseRequest.extend({
  username: z.string().openapi({
    description: "아이디",
    example: "admin",
  }),
  password: z.string().openapi({
    description: "비밀번호",
    example: "1234",
  }),
});

export const LoginData = z.object({
  token: z.string().openapi({
    description: "세션 토큰",
    example: "mock.session.token",
  }),
});

export const LoginResponse = createResponseSchema(LoginData);
