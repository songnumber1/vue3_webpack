/**
 * @file uploadFile.js
 * @description JavaScript module used by the Vue application runtime.
 * @author OpenAI
 */

import { z } from "../zod";
import { BaseRequest, createResponseSchema } from "./base";

export const UploadFileRequest = BaseRequest.extend({
  fileName: z.string().openapi({
    description: "파일명",
    example: "test.png",
  }),
  fileSize: z.number().openapi({
    description: "파일 크기(byte)",
    example: 1024,
  }),
});

export const UploadFileData = z.object({
  url: z.string().openapi({
    description: "업로드된 파일 URL",
    example: "https://mock.local/files/test.png",
  }),
});

export const UploadFileResponse = createResponseSchema(UploadFileData);
