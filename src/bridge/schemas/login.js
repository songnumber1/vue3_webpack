import {z} from "../zod";

export const LoginRequest = z.object({
  username: z.string().openapi({
    description: "아이디",
    example: "admin",
  }),
  password: z.string().openapi({
    description: "비밀번호",
    example: "1234",
  }),
});

export const LoginResponse = z.object({
  token: z.string().openapi({
    description: "JWT 토큰",
    example: "mock.jwt.token",
  }),
});
