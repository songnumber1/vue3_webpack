/**
 * @file composables/overlay/useOverlayRegistration.js
 * @description Vue Composition API 기반 상태/행동 분리 모듈입니다. UI 컴포넌트의 복잡도를 낮추기 위해 사용됩니다.
 */

import {computed, onBeforeUnmount, watch} from "vue";
import {useOverlayStore} from "@/stores/overlayStore";

// 싱글톤 패턴으로 관리되는 파일 스코프의 고유 시퀀스 넘버입니다.
// 애플리케이션 런타임 전체에서 오버레이 인스턴스 간의 ID 충돌을 완벽히 방지합니다.
let overlaySequence = 0;

/**
 * [순수 유틸리티] 오버레이 종류(종류 명칭)를 기반으로 겹치지 않는 고유 고리 식별자 ID를 동적 생성합니다.
 * @param {string} kind - 오버레이 유닛의 타입 성격 (예: 'modal', 'sheet', 'popover')
 * @returns {string} 'modal-1', 'sheet-2' 양식의 고유 문자열 키
 */
/**
 * 호출 흐름에서 재사용할 객체, 상태, context 또는 handler를 생성합니다.
 */
function createOverlayId(kind) {
  overlaySequence += 1;
  return `${kind || "overlay"}-${overlaySequence}`;
}

/**
 * @function useOverlayRegistration
 * @description 개별 오버레이 컴포넌트의 가시성 상태(`open`)와 모드 변동을 감시하여,
 * 중앙 통제소 스토어에 등록/제거 절차를 완전 자동으로 대행하는 생명주기 훅 컴포저블입니다.
 * @param {Object} config - 오버레이 식별 정보 파라미터 세트
 * @param {Ref<boolean>} config.open - 해당 오버레이 컴포넌트가 현재 화면에 열려있는지 타내는 반응형 플래그
 * @param {string} config.kind - 오버레이의 레이아웃 분류 규격
 * @param {Function|Ref<string>|string} config.mode - 상황별 우선순위나 스태킹 컨텍스트를 다르게 매핑하기 위한 동적 스크리닝 모드 플래그
 * @returns {Object} 템플릿 마크업 영역에서 HTML data-id 속성 등으로 커스텀 바인딩할 수 있는 { overlayId } 결과물
 */
export function useOverlayRegistration({open, kind, mode}) {
  // 1. 전역 오버레이 스택을 관리하는 Pinia/Vuex 마스터 상태 저장소를 인입합니다.
  const overlayStore = useOverlayStore();

  // 2. 인스턴스 초기화 시점에 이 컴포넌트만의 유일무이한 마스터 고유 Key를 영구 발급받습니다.
  const id = createOverlayId(kind);

  // 3. 다양한 형태로 전달될 수 있는 mode 아규먼트(일반 문자열, Ref 래퍼, 게터 함수 형태)를 computed로 단일 표준화 추려냅니다.
  const overlayMode = computed(() => {
    if (typeof mode === "function") return mode() || "default";
    return mode?.value || mode || "default";
  });

  // ── [반응형 리스너 A: 개폐 상태 실시간 추적 및 스토어 바인딩] ──────────────────
  // 컴포넌트가 마운트되는 즉시(`immediate: true`) 현재 열림 상태를 강제 스캔하여 스토어 윈도우 레이어 목록에 인덱싱합니다.
  watch(
    () => Boolean(open?.value),
    (isOpen) => {
      if (isOpen) {
        // 화면에 모달이 활성화된 경우 전역 매니저 스토어에 등록하여 Z-Index 정렬 및 ESC 닫기 타깃 대열에 합류시킵니다.
        overlayStore.registerOverlay({id, kind, mode: overlayMode.value});
      } else {
        // 닫히는 순간 스택 배열에서 안전하게 탈락 소거시킵니다.
        overlayStore.unregisterOverlay(id);
      }
    },
    {immediate: true}
  );

  // ── [반응형 리스너 B: 런타임 모드 동적 갱신 추적] ──────────────────
  // 오버레이가 이미 화면에 열려있는 상태에서 풀스크린 모드 전환 등 내부 스타일 분기가 치환될 때 스토어의 메타데이터를 정밀 실시간 동기화합니다.
  watch(overlayMode, (nextMode) => {
    if (!open?.value) return; // 현재 오버레이가 닫혀있는 휴면 상태라면 동기화 연산을 가드 차단합니다.
    overlayStore.registerOverlay({id, kind, mode: nextMode});
  });

  // ── 🧹 [컴포넌트 생명주기 마감: 메모리 누수 방어 가드] ──────────────────
  // 사용자가 페이지를 급격히 이탈하거나 라우터가 전환되어 해당 모달을 품은 부모 돔 컴포넌트가 파괴(Unmount)되기 직전,
  // 전역 저장소에 등록되어 있던 본인 식별 키 자원을 완전히 청소 제거함으로써 딤(암전 백드롭) 화면이 영구히 굳어버리는 치명적인 좀비 모달 결함을 차단합니다.
  onBeforeUnmount(() => {
    overlayStore.unregisterOverlay(id);
  });

  // 하위 컴포넌트 돔 제어 유닛용 고유 식별 명세 핸들 반환
  return {overlayId: id};
}
