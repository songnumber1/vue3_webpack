import {MODELS_RAW} from "@/api/mock/data/models.raw";
import {STUDIO_MODELS_RAW} from "@/api/mock/data/studioModels.raw";
import {resolveMock} from "./mockUtils";

export const modelApiMock = {
  getModels() {
    return resolveMock(MODELS_RAW, 170);
  },
  getStudioModels() {
    return resolveMock(STUDIO_MODELS_RAW, 190);
  },
};
