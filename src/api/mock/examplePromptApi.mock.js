import {EXAMPLE_PROMPTS_RAW} from "@/api/mock/data/examplePrompts.raw";
import {resolveMock} from "./mockUtils";

export const examplePromptApiMock = {
  getExamplePrompts({assistId} = {}) {
    return resolveMock(EXAMPLE_PROMPTS_RAW[assistId] || {list: []}, 140);
  },
};
