/**
 * @file api/runtime/chatApis.js
 * @description 현재 애플리케이션의 런타임 설정 상태(디버그, 로컬 개발, 서버리스 모크 모드 등)를 동적 감지하여, 백엔드와 직접 연동되는 실서버(Live) API 구현체 그룹과 로컬 시뮬레이션용 가상 데이터(Mock) API 구현체 그룹을 단일 통로에서 스위칭하여 내보내는 동적 전략(Strategy) 라우팅 모듈입니다.
 */

import {accessApiMock} from "@/api/mock/accessApi.mock";
import {assistantApiMock} from "@/api/mock/assistantApi.mock";
import {modelApiMock} from "@/api/mock/modelApi.mock";
import {examplePromptApiMock} from "@/api/mock/examplePromptApi.mock";
import {promptTemplateApiMock} from "@/api/mock/promptTemplateApi.mock";
import {chatHistoryApiMock} from "@/api/mock/chatHistoryApi.mock";
import {accessApiLive} from "@/api/live/accessApi.live";
import {assistantApiLive} from "@/api/live/assistantApi.live";
import {modelApiLive} from "@/api/live/modelApi.live";
import {examplePromptApiLive} from "@/api/live/examplePromptApi.live";
import {promptTemplateApiLive} from "@/api/live/promptTemplateApi.live";
import {chatHistoryApiLive} from "@/api/live/chatHistoryApi.live";
import {shouldUseFrontendMockApi} from "@/constants/apiMode";

/**
 * @description 현재 클라이언트 세션이 로컬 프론트엔드 모크(Mock) 파이프라인으로 구동되어야 하는지 판별하는 코어 판단 가드 함수입니다.
 * @returns {boolean} 모크 API 강제 가동 플래그 판정 결과 (`true`: 가상 모크 API 그룹 채택 / `false`: 실서버 Live API 그룹 채택)
 */
export function shouldUseMockChatApi() {
  // apiMode 상수에 정형화된 비즈니스 룰 및 환경 변수 조건식을 참조하여 결과를 반환
  return shouldUseFrontendMockApi();
}

/**
 * @typedef {object} ResolvedChatApis
 * @description 프론트엔드 서비스 부트스트랩 또는 컴포넌트 런타임 시점에 호출되어, 현재 설정에 맞는 가용 API 패키지(Mock 데이터 세트 또는 Live 네트워크 스트림)를 통째로 패킹하여 리턴합니다.
 * @property {object} accessApi - 세션 로그인 상태 및 토큰 유효 권한 검증을 관장하는 계정 엔드포인트 API 그룹
 * @property {object} assistantApi - 특정 비즈니스 도메인에 종속된 어시스턴트 카드 목록 조회를 담당하는 에이전트 API 그룹
 * @property {object} modelApi - LLM 인프라 및 추론 엔진(GPT, DeepSeek 등)의 메타 모델 구성을 바인딩하는 모델 API 그룹
 * @property {object} examplePromptApi - 채팅방 진입 시 초기 추천 칩으로 생성되는 다국어 예시 질문 연동용 프롬프트 API 그룹
 * @property {object} promptTemplateApi - 프롬프트 작곡기(Composer) 탭 내부 메일/번역/코드 등의 서식 포맷을 핸들링하는 템플릿 API 그룹
 * @property {object} chatHistoryApi - 유저가 과거에 대화했던 채팅 룸 세션 목록 및 누적 메시지 히스토리를 입출력하는 기록 API 그룹
 * @returns {ResolvedChatApis} 현재 서비스 생명 주기에 구속되어 런타임 개통이 완료된 도메인별 핵심 API 서비스 번들 오브젝트
 */
export function resolveChatApis() {
  // 케이스 A: 프론트엔드 독립형 모크 테스트 모드(또는 백엔드 인프라 오프라인 상태)가 감지되었을 때의 격리 라우팅
  if (shouldUseMockChatApi()) {
    return {
      accessApi: accessApiMock,
      assistantApi: assistantApiMock,
      modelApi: modelApiMock,
      examplePromptApi: examplePromptApiMock,
      promptTemplateApi: promptTemplateApiMock,
      chatHistoryApi: chatHistoryApiMock,
    };
  }

  // 케이스 B: 정상적인 프로덕션 상용 배포 스펙 또는 백엔드 API 게이트웨이 파이프라인이 정상 결합된 통상적인 라이브 연동 라우팅
  return {
    accessApi: accessApiLive,
    assistantApi: assistantApiLive,
    modelApi: modelApiLive,
    examplePromptApi: examplePromptApiLive,
    promptTemplateApi: promptTemplateApiLive,
    chatHistoryApi: chatHistoryApiLive,
  };
}
