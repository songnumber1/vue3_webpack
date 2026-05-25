/**
 * 현재 브라우저 탭이나 웹뷰 화면이 사용자에게 보이지 않는 백그라운드 상태(Hidden)인지 안전하게 판별합니다.
 * @returns {boolean} 화면이 가려져 있다면 true, 보고 있는 상태거나 서버 사이드 환경이면 false
 */
function isDocumentHidden() {
  // 브라우저 환경(document 객체가 존재)이면서 Page Visibility API의 hidden 속성이 true인지 검사합니다.
}

/**
 * 안드로이드 네이티브 앱의 생명주기 이벤트(`apppause`, `appresume`)와 연동하여
 * 스트림 데이터의 적재(Backlog) 및 화면 방출(Flush) 타이밍을 제어하는 훅 객체를 생성합니다.
 * @returns {Object} 스트림 라이프사이클 관리 인터페이스 객체 (`install`, `onAccumulated` 메서드 포함)
 * @see {@link streamGenerationAndroidWebView} 이 라이프사이클 규격을 주입받아 사용하는 메인 웹뷰 스트림 함수
 */
export function createAndroidWebViewSseLifecycle() {
  // 앱이 현재 백그라운드로 내려가 일시정지 상태인지 기록하는 플래그입니다.
  let paused = false;

  // 앱이 일시정지된 동안 화면에 반영되지 못하고 쌓여있는 대기 데이터(Backlog)가 있는지 기록하는 플래그입니다.
  let backlogPending = false;

  return {
    /**
     * 네이티브 앱의 생명주기 리스너를 전역 윈도우 객체에 등록합니다.
     * @param {Object} options - 라이프사이클 이벤트 발생 시 실행할 코어 액션 객체
     * @param {Function} options.flush - 대기 중인 버퍼 데이터를 화면에 즉시 밀어내어 렌더링하는 콜백 함수
     * @returns {Function} 컴포넌트 언마운트나 스트림 종료 시 리스너를 제거하는 클린업(Cleanup) 함수
     */
    install({flush}) {
      // 서버 사이드 렌더링 환경인 경우 이벤트 리스너를 등록할 수 없으므로 빈 함수(No-op)를 반환합니다.
      if (typeof window === "undefined") return () => {};

      /**
       * 안드로이드 네이티브 앱이 백그라운드로 전환될 때 실행되는 이벤트 핸들러입니다.
       */
      const handlePause = () => {
        // 일시정지 상태 플래그를 true로 전환합니다.
        paused = true;
        // 이 시점 이후로 들어오는 데이터는 대기 상태(Backlog)로 쌓이도록 예약 플래그를 활성화합니다.
        backlogPending = true;
      };

      /**
       * 안드로이드 네이티브 앱이 다시 포그라운드(화면)로 복귀할 때 실행되는 이벤트 핸들러입니다.
       */
      const handleResume = () => {
        // 일시정지 상태가 해제되었으므로 플래그를 false로 전환합니다.
        paused = false;

        // 백그라운드에 있는 동안 밀린 데이터(Backlog)가 존재한다면,
        if (backlogPending) {
          // 대기 플래그를 꺼주고,
          backlogPending = false;
          // 그동안 쌓였던 모든 스트림 데이터를 화면에 즉시 갱신(`flush`)하도록 코어 엔진에 명령합니다.
          flush?.();
        }
      };

      // 이벤트 캡처링 단계를 활성화하여 안드로이드 앱이 던져주는 'apppause' 이벤트를 감지합니다.
      window.addEventListener("apppause", handlePause, {capture: true});
      // 이벤트 캡처링 단계를 활성화하여 안드로이드 앱이 던져주는 'appresume' 이벤트를 감지합니다.
      window.addEventListener("appresume", handleResume, {capture: true});

      // 이 install 함수를 호출한 곳(try...finally의 cleanup 등)에서 이벤트 리스너를 안전하게 해제할 수 있도록 해제 함수를 반환합니다.
      return () => {
        window.removeEventListener("apppause", handlePause, {capture: true});
        window.removeEventListener("appresume", handleResume, {capture: true});
      };
    },

    /**
     * SSE 스트림으로부터 새로운 데이터 청크가 누적되어 들어올 때마다 호출되는 내부 훅입니다.
     * @param {Object} params - 누적 데이터 및 커밋 제어 인터페이스
     * @param {string} params.accumulated - 현재까지 스트림으로 수신된 전체 누적 텍스트 데이터
     * @param {Object} params.committer - 프론트엔드 상태를 안전하게 업데이트하는 커미터 객체
     * @see {@link isDocumentHidden} 탭의 활성화 여부를 함께 체크하여 정밀하게 버퍼링 상태를 판별합니다.
     */
    onAccumulated({accumulated, committer}) {
      // Android 13+ 버전 이상의 웹뷰는 시스템 백그라운드로 갔다가 복귀하는 시점을 브라우저 레벨에서도 명확히 통지받을 수 있습니다.
      // 따라서 앱이 일시정지(`paused`) 상태이거나 웹뷰 창 자체가 숨겨진(`isDocumentHidden`) 상태라면 밀린 데이터가 있다고 마킹해 둡니다.
      if (paused || isDocumentHidden()) backlogPending = true;

      // 화면 표시 여부와 상관없이 메모리 상의 수신 데이터 자체는 항상 최신 상태로 커밋(`update`)을 예약해 둡니다.
      // 이후 앱이 다시 켜질 때 `handleResume` 안의 `flush()`가 실행되면서 이 최신 커밋본이 화면에 한 번에 뿌려집니다.
      committer.update(accumulated);
    },
  };
}
