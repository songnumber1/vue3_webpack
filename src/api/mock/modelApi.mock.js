import {MODELS_RAW} from "@/data/raw/models.raw";
import {STUDIO_MODELS_RAW} from "@/data/raw/studioModels.raw";
import {resolveMock} from "./mockUtils";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
export const modelApiMock = {
  getModels() {
    return resolveMock(MODELS_RAW, 170);
  },
  getStudioModels() {
    return resolveMock(STUDIO_MODELS_RAW, 190);
  },
};
