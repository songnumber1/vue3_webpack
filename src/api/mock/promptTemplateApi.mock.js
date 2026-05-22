import {PROMPT_TEMPLATES_RAW} from "@/api/mock/data/promptTemplates.raw";
import {resolveMock} from "./mockUtils";

export const promptTemplateApiMock = {
  getPromptTemplates() {
    return resolveMock(PROMPT_TEMPLATES_RAW, 80);
  },
};
