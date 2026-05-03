import {z} from "../zod";

export const GetUserRequest = z.object({
  id: z.number().openapi({
    description: "유저 ID",
    example: 1,
  }),
});

export const GetUserResponse = z.object({
  id: z.number().openapi({
    description: "유저 ID",
    example: 1,
  }),
  name: z.string().openapi({
    description: "유저 이름",
    example: "홍길동",
  }),
});
