import {EXAMPLE_PROMPTS_RAW} from "@/data/raw/examplePrompts.raw";
import {resolveMock} from "./mockUtils";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
export const examplePromptApiMock = {
  getExamplePrompts({assistId} = {}) {
    // 계산된 결과를 호출부로 반환합니다.
    return resolveMock(EXAMPLE_PROMPTS_RAW[assistId] || {list: []}, 140);
  },
};
