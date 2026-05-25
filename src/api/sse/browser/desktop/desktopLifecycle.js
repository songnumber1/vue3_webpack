/**
 * @file api/sse/browser/desktop/desktopLifecycle.js
 * @description 데스크톱(Desktop) 브라우저 환경에서 사용자가 현재 탭을 닫거나, 새로고침을 하거나, 다른 페이지로 이동(이탈)할 때 남아 있는 SSE ReadableStream 요청을 안전하게 중단하고 브라우저 네이티브 가비지 컬렉션(GC) 타이밍에 맞춰 리소스를 정리하는 데스크톱 전용 라이프사이클 제어 레이어 모듈입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {createAbortError} from "@/api/sse/common/sseErrors";
import {logWarn} from "@/utils/logger";

/**
 * @description 데스크톱 브라우저 이탈(창 닫기/새로고침) 발생 시 실행 중인 AbortController 시그널을 즉시 파괴할 뿐만 아니라, 네이티브 스트림 리더(ReadableStreamDefaultReader)의 취소(`reader.cancel`)까지 연쇄 집행하여 불필요한 네트워크 대역폭 낭비 및 좀비 커넥션을 방어하는 강제 중단 헬퍼 함수입니다.
 * @param {AbortController|null} controller - 현재 생성되어 가동 중인 네트워크 차단용 AbortController 인스턴스
 * @param {function(): ReadableStreamDefaultReader|null} getReader - 현재 네트워크 파이프라인에서 스트림 버퍼를 읽어 들이고 있는 네이티브 리더 인스턴스를 추출하는 게터 함수
 * @param {string} reason - 예외 디버깅 로그 및 에러 객체 내부에 마킹할 명시적인 중단 사유 메시지
 * @returns {void}
 */
function abortController(controller, getReader, reason) {
  // 이미 요청이 취소되었거나 컨트롤러 자체가 존재하지 않는 경우 불필요한 중복 실행 방지를 위해 가드 분기 처리
  if (!controller || controller.signal.aborted) return;

  // 비즈니스 전용 에러 팩토리를 활용하여 표준 사유가 주입된 AbortError 생성
  const abortReason = createAbortError(reason);

  try {
    // Abort 시그널에 구체적인 중단 사유를 주입하여 전파 시도
    controller.abort(abortReason);
  } catch (_error) {
    // 구형 브라우저 등 사유 주입 구문을 지원하지 않는 런타임을 위한 표준 abort 처리
    controller.abort();
  }

  // 스트림 리더 강제 취소: AbortController 호출만으로는 브라우저 메모리 내부의 스트림 리더가 즉시 해제되지 않는 좀비 스레드 현상을 원천 방어
  const reader = getReader?.();
  if (reader) {
    reader.cancel(controller.signal.reason || abortReason).catch((error) => {
      logWarn("[desktopLifecycle] reader cancel failed:", error);
    });
  }
}

/**
 * @description 데스크톱(Desktop) 브라우저 환경의 특성(탭 파괴, 페이지 이탈, 창 닫기, 새로고침 등)에 맞추어, 프로세스 언로드 시점에 가동 중인 SSE 스트림을 안정적으로 셧다운하고 리소스를 수거하는 라이프사이클 제어 인스턴스를 빌드합니다.
 * @returns {{
 * install: (param: { controller: AbortController, getReader: () => ReadableStreamDefaultReader|null }) => () => void,
 * onAccumulated: (param: { accumulated: any, committer: { update: (data: any) => void } }) => void
 * }} 가동 준비가 완료된 데스크톱 전용 라이프사이클 제어기 객체
 */
export function createDesktopSseLifecycle() {
  return {
    /**
     * @description 실제 SSE 챗 생성 스트림 오퍼레이션이 발동되는 라이프사이클에 진입 시, 데스크톱 네이티브 브라우저 이탈 이벤트(pagehide, beforeunload)를 장착 개통합니다.
     * @param {object} param - 라이프사이클 설치를 위한 핵심 제어 팩
     * @param {AbortController} param.controller - 현재 SSE 네트워크 개통에 묶여 있는 중단 제어용 AbortController 인스턴스
     * @param {function(): ReadableStreamDefaultReader|null} param.getReader - 런타임 스트림 버퍼 리더 추출용 게터 핸들러
     * @returns {function(): void} 컴포넌트 언마운트 및 스트림 정상 종료 시 리스너를 제거하는 전역 이벤트 버스 리무버 클린업 함수
     */
    install({controller, getReader}) {
      // 서버 사이드 렌더링(SSR) 컨텍스트 환경에서의 오작동 방지를 위한 전역 window 가드 처리
      if (typeof window === "undefined") return () => {};

      // 브라우저 언로드 및 이탈 징후가 포착되었을 때 실행할 통합 이벤트 핸들러 정의
      const handlePageEnd = () => {
        abortController(controller, getReader, "page lifecycle ended");
      };

      // 데스크톱 환경에서 가시성이 사라지거나(pagehide), 탭이 닫히거나 새로고침(beforeunload)되는 시점을 캡처링 단계에서 캐치하도록 리스너 등록
      window.addEventListener("pagehide", handlePageEnd, {capture: true});
      window.addEventListener("beforeunload", handlePageEnd, {capture: true});

      // 컴포넌트 해제 또는 스트림 라이프사이클 종료 시점에 메모리 누수 방지를 위해 이벤트 리스너를 탈거하는 클린업 함수 반환
      return () => {
        window.removeEventListener("pagehide", handlePageEnd, {capture: true});
        window.removeEventListener("beforeunload", handlePageEnd, {
          capture: true,
        });
      };
    },

    /**
     * @description 실시간 대화창 글자 입력 청크 버퍼가 인입될 때마다 호출되며, 모바일 환경과 달리 적체 과정 없이 뷰 스토어 레이어에 실시간으로 즉시 반영(하이드레이션)을 단행합니다.
     * @param {object} param - 인입된 데이터와 상태 반영을 위한 커미터 팩
     * @param {*} param.accumulated - 현재까지 마크다운 파서 및 SSE 버퍼를 통해 조립 누적된 완제품 형태의 텍스트/데이터
     * @param {object} param.committer - 실제 뷰 레이어 스토어로 데이터를 디스패치 및 하이드레이션하는 가공 커미터 인스턴스
     * @param {function(*): void} param.committer.update - 스토어 상태를 최신화하는 내부 업데이트 메서드
     * @returns {void}
     */
    onAccumulated({accumulated, committer}) {
      committer.update(accumulated);
    },
  };
}
