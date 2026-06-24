/**
 * @file composables/events/useOutsideClick.js
 * @description Vue Composition API 기반 상태/행동 분리 모듈입니다. UI 컴포넌트의 복잡도를 낮추기 위해 사용됩니다.
 */

import {useEventListener} from "@vueuse/core";

function unwrapRoot(root) {
  // 인자가 게터 함수 형태(`() => element`)면 실행하여 값을 뽑아내고, 일반 객체나 Ref면 그대로 우회 통과시킵니다.
  const value = typeof root === "function" ? root() : root;
  // 추출된 최종 래퍼에서 Vue의 실질적인 돔 포인터인 `.value`가 존재하면 꺼내고, 아니라면 순수 네이티브 돔 노드 자체를 안전 반환합니다.
  return value?.value || value;
}

/**
 * 현재 상태가 특정 조건을 만족하는지 판단합니다.
 */
function isEventInsideElement(event, element) {
  if (!element) return false; // 타깃 검증용 네이티브 돔 노드가 존재하지 않는 비정상적인 상황이면 즉시 거짓(false) 이탈

  // 네이티브 이벤트 표준 API: 클릭이 일어난 말단 자식 노드부터 최상위 도큐먼트 노드까지 타고 올라가는 거품 정렬 이벤트 버블링 경로 배열을 로드합니다.
  const path =
    typeof event.composedPath === "function" ? event.composedPath() : [];

  // 1차 추적 검증 (가장 정밀함): 이벤트 전파 경로 배열 내부에 타깃 엘리먼트 노드가 직접 명세되어 포함되어 있다면 내부 클릭으로 간주(true)
  if (path.length && path.includes(element)) return true;

  // 2차 폴백 검증 (구형 커널 대응): 네이티브 `contains` API를 인보크하여 실제 타깃 노드 하부에 클릭된 이벤트 타깃이 종속되어 있는지 대조 판별
  return element.contains?.(event.target) || false;
}

/**
 * @description 지정한 root 외부 pointerdown 시 callback을 실행합니다.
 * @param {*} roots - 단일 root 또는 root 배열입니다.
 * @param {Function} callback - 외부 클릭 콜백입니다.
 * @param {Object} options - shouldIgnore 옵션을 지원합니다.
 * @returns {Function} 이벤트 정리 함수입니다.
 */
export function useOutsideClick(roots, callback, options = {}) {
  // 특정 상황(예: 메뉴를 여는 토글 버튼 자체를 클릭했을 때의 중복 연산 버스트 등)에서 클릭 검증을 강제 통과/예외 처리해 주기 위한 조건식 사용자 정의 콜백 로드
  const shouldIgnore = options.shouldIgnore || (() => false);
  // 모바일 하드웨어 런타임 레이턴시를 제어하기 위해 기본 인터랙션 액션을 'pointerdown'으로 잡되, 필요 시 커스텀 이벤트 바인딩 허용
  const eventName = options.eventName || "pointerdown";

  // 브라우저 도큐먼트 전역에 리스닝되어 있는 포인터 이벤트가 발생할 때마다 멱등성 검증을 수행하는 핵심 이너 핸들러
  function handleOutsideEvent(event) {
    if (shouldIgnore(event)) return; // 개발자가 사전에 정의한 예외 이탈 가드 조건에 걸려들면 즉각 파이프라인 무효 중단

    // 단일 돔 객체(`Ref`)나 게터 배열 등 다양한 형태가 섞여 들어올 수 있으므로, 무조건 배열 구조(`[...]`)로 단일화 래핑한 뒤 언랩 수색을 거쳐 유효 돔만 필터링 수집
    const elements = (Array.isArray(roots) ? roots : [roots])
      .map(unwrapRoot)
      .filter(Boolean);

    // [중요 비즈니스 판정 공식]: 수집된 감시 대상 레이어 배열 중 '단 하나라도' 이벤트 내부 영역 클릭으로 최종 판정(`some`)된다면,
    // 이는 바깥을 누른 것이 아니라 모달 내부의 버튼 등을 조작한 것이므로 콜백 실행을 거부하고 조기 리턴 탈출
    if (elements.some((element) => isEventInsideElement(event, element)))
      return;

    callback(event); // 위의 모든 가드를 뚫고 내려왔다면 완전한 '지정 영역 외부 클릭'이 성립하므로 비로소 모달 폐쇄 콜백 실행
  }

  // VueUse의 고성능 라이프사이클 통합 리스너를 통해 document 단에 이벤트를 바인딩하고, 컴포넌트 언마운트 시 자동으로 청소되는 오토 클린업 함수를 최종 팩토리 반환
  return useEventListener(document, eventName, handleOutsideEvent, {
    capture: true, // [필수 가드]: 부모/자식 간 이벤트 전파 순서 요동으로 인해 창이 열리자마자 닫히는 레이스 컨디션을 원천 봉쇄하기 위해 캡처링 단계에서 최우선 하이재킹 가동
    passive: true, // 모바일 웹 브라우저의 부드러운 스크롤 스레드 프레임 확보 및 터치 성능 병목 차단을 위해 패시브 최적화 옵션 인입
  });
}
