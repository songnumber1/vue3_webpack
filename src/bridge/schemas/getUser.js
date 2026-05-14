/**
 * @file getUser.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import { z } from "../zod";
import { BaseRequest, createResponseSchema } from "./base";

export const GetUserRequest = BaseRequest.extend({
  id: z.number().openapi({
    description: "유저 ID",
    example: 1
  })
});

export const GetUserData = z.object({
  id: z.number().openapi({
    description: "유저 ID",
    example: 1
  }),
  name: z.string().openapi({
    description: "유저 이름",
    example: "홍길동"
  })
});

export const GetUserResponse = createResponseSchema(GetUserData);
