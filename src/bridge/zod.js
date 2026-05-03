import {z} from "zod";
import {extendZodWithOpenApi} from "@asteasolutions/zod-to-openapi";

// Zod OpenAPI 확장은 반드시 스키마 생성 전에 1회만 실행한다.
extendZodWithOpenApi(z);

export {z};
