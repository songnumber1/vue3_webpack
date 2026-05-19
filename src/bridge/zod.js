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
