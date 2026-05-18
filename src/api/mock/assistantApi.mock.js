import {ASSISTANTS_RAW} from "@/data/raw/assistants.raw";
import {STUDIOS_RAW} from "@/data/raw/studios.raw";
import {resolveMock} from "./mockUtils";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
export const assistantApiMock = {
  getAssistants() {
    // 계산된 결과를 호출부로 반환합니다.
    return resolveMock(ASSISTANTS_RAW, 180);
  },
  getStudios() {
    // 계산된 결과를 호출부로 반환합니다.
    return resolveMock(STUDIOS_RAW, 220);
  },
};
