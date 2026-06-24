/**
 * @file platform/bridge/zod.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 */

import {z, ZodType} from "zod";

if (typeof ZodType?.prototype?.openapi !== "function") {
  Object.defineProperty(ZodType.prototype, "openapi", {
    value() {
      return this;
    },
    configurable: true,
  });
}

export {z};
