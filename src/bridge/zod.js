import {z, ZodType} from "zod";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
// 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
if (typeof ZodType?.prototype?.openapi !== "function") {
  Object.defineProperty(ZodType.prototype, "openapi", {
    value() {
      return this;
    },
    configurable: true,
  });
}

export {z};
