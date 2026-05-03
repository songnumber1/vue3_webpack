import {z} from "zod";
import {extendZodWithOpenApi} from "@asteasolutions/zod-to-openapi";

// 🔥 반드시 먼저 실행 (이 파일 기준 보장)
extendZodWithOpenApi(z);

export const GetUserRequest = z.object({
  id: z.number().openapi({
    description: "유저 ID",
  }),
});

export const GetUserResponse = z.object({
  id: z.number().openapi({
    description: "유저 ID",
  }),
  name: z.string().openapi({
    description: "유저 이름",
  }),
});
