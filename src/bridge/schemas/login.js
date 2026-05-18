import {z} from "../zod";
import {BaseRequest, createResponseSchema} from "./base";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
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
    description: "JWT 토큰",
    example: "mock.jwt.token",
  }),
});

export const LoginResponse = createResponseSchema(LoginData);
