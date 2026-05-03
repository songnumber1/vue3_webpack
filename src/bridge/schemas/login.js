import {z} from "zod";
import {extendZodWithOpenApi} from "@asteasolutions/zod-to-openapi";

// 🔥 반드시 먼저 실행 (이 파일 기준 보장)
extendZodWithOpenApi(z);

export const LoginRequest = z.object({
  username: z.string().openapi({description: "아이디"}),
  password: z.string().openapi({description: "비밀번호"}),
});

export const LoginResponse = z.object({
  token: z.string().openapi({description: "JWT 토큰"}),
});
