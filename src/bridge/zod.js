/**
 * @file zod.js
 * @description Runtime-safe Zod export. The OpenAPI metadata method is kept as a lightweight no-op so schemas can be shared by runtime validation and Swagger generation without forcing OpenAPI tooling into the main bundle.
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
