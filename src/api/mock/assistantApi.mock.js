import {ASSISTANTS_RAW} from "@/api/mock/data/assistants.raw";
import {STUDIOS_RAW} from "@/api/mock/data/studios.raw";
import {resolveMock} from "./mockUtils";

export const assistantApiMock = {
  getAssistants() {
    return resolveMock(ASSISTANTS_RAW, 180);
  },
  getStudios() {
    return resolveMock(STUDIOS_RAW, 220);
  },
};
