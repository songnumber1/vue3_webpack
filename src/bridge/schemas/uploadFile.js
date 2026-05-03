import {z} from "zod";
import {extendZodWithOpenApi} from "@asteasolutions/zod-to-openapi";

// 🔥 반드시 먼저 실행 (이 파일 기준 보장)
extendZodWithOpenApi(z);

export const UploadFileRequest = z.object({
  fileName: z.string().openapi({
    description: "파일명",
    example: "test.png",
  }),
  fileSize: z.number().openapi({
    description: "파일 크기",
    example: 1024,
  }),
});

export const UploadFileResponse = z.object({
  url: z.string().openapi({description: "업로드된 파일 URL"}),
});
