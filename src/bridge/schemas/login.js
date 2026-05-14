/**
 * @file login.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import { z } from "../zod";
import { BaseRequest, createResponseSchema } from "./base";

export const LoginRequest = BaseRequest.extend({
  username: z.string().openapi({
    description: "아이디",
    example: "admin"
  }),
  password: z.string().openapi({
    description: "비밀번호",
    example: "1234"
  })
});

export const LoginData = z.object({
  token: z.string().openapi({
    description: "JWT 토큰",
    example: "mock.jwt.token"
  })
});

export const LoginResponse = createResponseSchema(LoginData);
