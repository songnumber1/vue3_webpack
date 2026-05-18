import {z} from "../zod";
import {BaseRequest, createResponseSchema} from "./base";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
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
