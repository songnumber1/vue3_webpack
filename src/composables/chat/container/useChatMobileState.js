import {computed} from "vue";

/**
 * @description 시스템 플랫폼 메타 데이터 패킷을 해독하여 현재 에이전트가 모바일 전용 웹 브라우저 커널 환경이거나, 또는 안드로이드 네이티브 앱/웹뷰 내부 환경에서 동작 중인지 여부를 논리값(Boolean)으로 판별합니다.
 * @param {object} [platformInfo={}] - 시스템 플랫폼 저장소(Platform Store)에서 제공하는 환경 분석 스냅샷 객체
 * @returns {boolean} 모바일 플랫폼 레이아웃 강제 활성화 대상 여부
 */
function shouldUseMobilePlatformLayout(platformInfo = {}) {
  if (platformInfo.isPlatformForced) {
    return Boolean(
      platformInfo.isAndroidApp ||
        platformInfo.isNativeApp ||
        platformInfo.isNativeRuntime ||
        (platformInfo.actualEnv === "android" &&
          platformInfo.actualRuntime !== "native")
    );
  }

  return Boolean(
    platformInfo.isMobileBrowser ||
      platformInfo.isAndroidApp ||
      platformInfo.isNativeApp ||
      platformInfo.isNativeRuntime
  );
}

/**
 * @description 뷰포트의 물리적인 미디어 쿼리 크기(Compact 여부)와 디바이스 본연의 런타임 하드웨어 특성을 수학적 합집합 조건으로 교차 검증하여, UI 전반의 렌더링 분기 기준점이 되는 통합 `isMobile` 상태 레버를 추출 및 관리하는 훅입니다.
 * @param {ChatMobileStateDependencies} dependencies - 다른 시스템 스토어에서 공유 및 하향식 위임되어 결합될 상태 원품 팩
 * @returns {{ isMobile: import('vue').ComputedRef<boolean>, updateMobileState: () => void }} 템플릿 영역 및 하부 레이아웃 제어 단바인딩용 반응형 모델 묶음
 */
export function useChatMobileState({isCompactScreen, platformInfo}) {
  // [중요 아키텍처 공식]: 미디어 쿼리상 소형 해상도 조건이 충족되었거나, 혹은 데스크톱 해상도이더라도 네이티브 앱 환경 등의 강제 모바일 플랫폼 징후가 잡힌 경우 최종 모바일 뷰모드로 동기 수립(Computed) 처리
  const isMobile = computed(() =>
    Boolean(
      isCompactScreen.value || shouldUseMobilePlatformLayout(platformInfo.value)
    )
  );

  /**
   * @description [레거시 하위 호환 가드]: 기존 레거시 컴포넌트들의 창 크기 리사이즈(resize) 이벤트나 watch 핸들러 호출부에서 관습적으로 실행하던 상태 갱신 메서드 스텁(Stub)입니다.
   * 현재 `isMobile` 속성은 상단 뷰포트/플랫폼 스토어의 원자적 반응형 데이터 스트림에 의해 100% 선언적으로 자동 연산되므로, 이 함수는 하위 호환 작동 수립용 빈 껍데기 함수로 안전하게 보존합니다.
   */
  function updateMobileState() {
    // Kept for existing resize/watch call sites. isMobile is computed, so the
    // actual state update is driven by viewportStore/platformStore reactivity.
  }

  // 레이아웃 분기가 필요한 채팅 메인 컨테이너 및 네비게이션 드로어 부모 단바인딩 패키지 반환
  return {
    isMobile,
    updateMobileState,
  };
}
