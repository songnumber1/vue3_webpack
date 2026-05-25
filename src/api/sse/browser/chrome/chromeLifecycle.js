/**
 * @file api/sse/browser/chrome/chromeLifecycle.js
 * @description 안드로이드 크롬(Chrome) 및 삼성 인터넷 등 모바일 브라우저 환경에서 발생할 수 있는 탭 전환, 화면 잠금, 백그라운드 전환 시의 SSE ReadableStream 지연/정지 현상을 방어하고 브라우저 생명 주기(Page Lifecycle)에 대응하여 스트림을 안정적으로 차단 및 복구하는 제어 레이어 모듈입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {
  createAbortError,
  isGenerationAbortError,
} from "@/api/sse/common/sseErrors";
import {logWarn} from "@/utils/logger";
import {i18n} from "@/i18n";

/** * @constant {string}
 * @description 모바일 백그라운드 이탈 후 복귀 시 다국어 알림 팝업에 출력할 i18n 언어팩 키 식별자
 */
const MOBILE_BACKGROUND_ABORT_RESUME_ALERT_KEY =
  "chat.lifecycle.mobileBackgroundAbortResumeAlert";

/**
 * @description 현재 실행 중인 렌더러의 최상위 웹 문서(DOM)가 사용자 스크린 상에서 은닉(Background 전환, 타 탭 이동 등)되었는지 여부를 물리적으로 판정합니다.
 * @returns {boolean} 브라우저 활성 상태 은닉 여부 결과 (`true`: 백그라운드 상태 / `false`: 포어그라운드 노출 상태)
 */
function isDocumentHidden() {
  return typeof document !== "undefined" && document.hidden;
}

/**
 * @description 모바일 환경에서 백그라운드 전환 발생 시 실행 중인 AbortController 시그널을 전파할 뿐만 아니라, 네이티브 스트림 리더(ReadableStreamDefaultReader)의 중도 취소(`reader.cancel`)까지 병렬 집행하여 모바일 메모리 락(Lock)을 방어적으로 해제하는 강제 중단 헬퍼 함수입니다.
 * @param {AbortController|null} controller - 현재 생성되어 가동 중인 네트워크 차단용 AbortController 인스턴스
 * @param {function(): ReadableStreamDefaultReader|null} getReader - 현재 네트워크 파이프라인에서 버퍼를 갉아먹고 있는 네이티브 리더 인스턴스를 동적으로 추출하는 게터 함수
 * @param {string} reason - 예외 디버깅 로그 및 에러 객체 내부에 마킹할 명시적인 중단 사유 메시지
 * @returns {void}
 */
function abortController(controller, getReader, reason) {
  if (!controller || controller.signal.aborted) return;

  const abortReason = createAbortError(reason);
  try {
    controller.abort(abortReason);
  } catch (_error) {
    支配_; // 런타임 호환성을 고려한 표준 낙태 명령 2차 폴백 실행
    controller.abort();
  }

  const reader = getReader?.();
  if (reader) {
    reader.cancel(controller.signal.reason || abortReason).catch((error) => {
      if (!isGenerationAbortError(error)) {
        logWarn("[chromeLifecycle] reader cancel failed:", error);
      }
    });
  }
}

/**
 * @description 크롬 및 안드로이드/삼성인터넷 등 모바일 브라우저의 전력 절감용 스레드 일시정지(Freeze) 현상에 대응하여, 안전한 스트림 중단 및 포어그라운드 복귀 시 1회성 다국어 알림 팝업 창 출력을 오케스트레이션하는 크롬 전용 SSE 라이프사이클 인스턴스를 빌드합니다.
 * @returns {ChromeSseLifecycleInstance} 가동 준비가 완료된 크롬 전용 라이프사이클 제어기 본품
 */
export function createChromeSseLifecycle() {
  const settings = useSystemSettingsStore();
  const abortOnBackground = Boolean(settings.abortChatOnMobileBackground);

  let hiddenBacklogPending = false;
  let pendingResumeAlert = false;
  let resumeAlertCleanup = null;

  /** * @description 메모리 잔존 및 중복 바인딩을 차단하기 위해 복귀 안내용 이벤트 브릿지 채널을 일괄 소멸시킵니다.
   */
  const clearResumeAlertListeners = () => {
    if (typeof resumeAlertCleanup === "function") resumeAlertCleanup();
    resumeAlertCleanup = null;
  };

  /** * @description 사용자가 최종적으로 포어그라운드로 안착했고 대기 플래그가 참일 때, 브라우저 동기 윈도우 알림창(window.alert)을 통해 세션 유실 안내 문구를 팝업 노출합니다.
   */
  const showResumeAlert = () => {
    if (!pendingResumeAlert) return;
    if (isDocumentHidden()) return;

    pendingResumeAlert = false;
    clearResumeAlertListeners();

    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.alert(i18n.global.t(MOBILE_BACKGROUND_ABORT_RESUME_ALERT_KEY));
    }
  };

  /** * @description 브라우저 복귀 징후를 가장 민감하고 빠르게 캐치할 수 있는 3대 이벤트(visibilitychange, pageshow, focus)를 캡처링 단계에서 동시 추적 예약합니다.
   */
  const scheduleResumeAlert = () => {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;

    pendingResumeAlert = true;
    clearResumeAlertListeners();

    const handleResume = () => showResumeAlert();

    document.addEventListener("visibilitychange", handleResume, {
      capture: true,
    });
    window.addEventListener("pageshow", handleResume, {capture: true});
    window.addEventListener("focus", handleResume, {capture: true});

    resumeAlertCleanup = () => {
      document.removeEventListener("visibilitychange", handleResume, {
        capture: true,
      });
      document.removeEventListener("pageshow", handleResume, {capture: true});
      window.removeEventListener("focus", handleResume, {capture: true});
    };
  };

  return {
    /**
     * @description 실제 SSE 챗 생성 스트림 오퍼레이션이 발동되는 라이프사이클에 진입 시, 모바일 네이티브 브라우저 이벤트 버스(Visibility API, Page Lifecycle API)를 장착 개통합니다.
     * @param {SseLifecycleInstallerParam} installer - 가동 중인 타깃 제어 컨트롤러 및 버퍼 제어 팩 파라미터
     * @returns {function(): void} 컴포넌트 언마운트 및 스트림 종료 시 호출해야 하는 전역 이벤트 버스 리무버 클린업 함수
     * * @note 지연 정리 가드 아키텍처(Delay Cleanup Guard):
     * 백그라운드 이탈 시점에 스트림 강제 중단(abort)이 체결되면, 호출부의 비동기 파이프라인 finally 블록에 의해 이 클린업 리턴 함수가 즉시 연쇄 호출됩니다.
     * 이때 무조건 `clearResumeAlertListeners()`를 실행하면 복귀 안내 팝업창 채널까지 함께 소멸하는 레이스 컨디션 버그가 발생하므로,
     * `pendingResumeAlert`가 활성화되어 있을 때는 안내 리스너 유지를 위해 정리를 유예하고 실제 팝업창이 노출되어 닫히는 시점(`showResumeAlert`)에 안전하게 정리하도록 유도합니다.
     */
    install({controller, getReader, flush}) {
      if (typeof window === "undefined" || typeof document === "undefined") {
        return () => {};
      }

      const abortForBackground = (reason) => {
        if (!abortOnBackground) return;
        scheduleResumeAlert();
        abortController(controller, getReader, reason);
      };

      const handleVisibilityChange = () => {
        if (document.hidden) {
          hiddenBacklogPending = true;
          abortForBackground("mobile page hidden");
          return;
        }

        if (hiddenBacklogPending) {
          hiddenBacklogPending = false;
          flush?.();
        }
      };

      const handlePageHide = () => abortForBackground("mobile page hidden");
      const handleFreeze = () => abortForBackground("mobile page frozen");

      const handleFocus = () => {
        if (!isDocumentHidden() && hiddenBacklogPending) {
          hiddenBacklogPending = false;
          flush?.();
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange, {
        capture: true,
      });
      window.addEventListener("pagehide", handlePageHide, {capture: true});
      window.addEventListener("freeze", handleFreeze, {capture: true});
      window.addEventListener("pageshow", handleFocus, {capture: true});
      window.addEventListener("focus", handleFocus, {capture: true});

      return () => {
        if (!pendingResumeAlert) {
          clearResumeAlertListeners();
        }

        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
          {capture: true}
        );
        window.removeEventListener("pagehide", handlePageHide, {capture: true});
        window.removeEventListener("freeze", handleFreeze, {capture: true});
        window.addEventListener("pageshow", handleFocus, {capture: true});
        window.removeEventListener("focus", handleFocus, {capture: true});
      };
    },

    /**
     * @description 실시간 대화창 글자 입력 청크 버퍼가 SSE 네트워크 파이프라인에서 추출 누적되어 올라올 때마다 필터링 및 적체 처리를 제어하는 훅입니다.
     * @param {SseLifecycleAccumulatedParam} options - 누적 완제품 청크 세트 및 스토어 바인딩용 커미터
     * @returns {void}
     */
    onAccumulated({accumulated, committer}) {
      if (isDocumentHidden()) {
        hiddenBacklogPending = true;
        committer.update(accumulated);
        return;
      }
      committer.update(accumulated);
    },
  };
}
