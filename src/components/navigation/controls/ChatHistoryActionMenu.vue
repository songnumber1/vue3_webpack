<template>
  <BaseBottomSheet
    :open="mobileOpen"
    :title="targetTitle"
    initial-snap="content"
    :min-height="280"
    overlay-class="chat-history-menu-overlay"
    @close="$emit('close')"
  >
    <div class="chat-history-sheet-options">
      <button
        v-for="action in actions"
        :key="action.key"
        class="bottom-sheet-option bottom-sheet-option--row chat-history-action-option"
        :class="{'chat-history-action-option--danger': action.danger}"
        type="button"
        @click="$emit('select', action.key)"
      >
        <span aria-hidden="true">{{ action.icon }}</span>
        <strong>{{ action.label }}</strong>
      </button>
    </div>
  </BaseBottomSheet>

  <teleport to="body">
    <div
      v-if="desktopOpen"
      ref="menuRef"
      class="chat-history-context-menu-shell"
      :style="contextMenuStyle"
    >
      <transition name="context-menu-fade">
        <div
          v-show="positionReady"
          class="chat-history-context-menu"
          role="menu"
        >
          <button
            v-for="action in actions"
            :key="action.key"
            class="chat-history-context-menu__item"
            :class="{'chat-history-context-menu__item--danger': action.danger}"
            type="button"
            role="menuitem"
            @click="$emit('select', action.key)"
          >
            <span aria-hidden="true">{{ action.icon }}</span>
            <span>{{ action.label }}</span>
          </button>
        </div>
      </transition>
    </div>
  </teleport>
</template>

<script setup>
/**
 * @file components/navigation/controls/ChatHistoryActionMenu.vue
 * @description 좌측 메뉴/드로어 관련 UI입니다. navigation store 상태와 사용자 메뉴 action을 화면에 연결합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, nextTick, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {autoUpdate, flip, offset, shift, useFloating} from "@floating-ui/vue";
import BaseBottomSheet from "@/components/common/bottom-sheet/BaseBottomSheet.vue";

/**
 * @description 상위 컴포넌트에서 주입되는 메뉴 상태 및 Floating UI 추적용 타깃 엘리먼트 정보 명세
 * @property {boolean} open - 메뉴 컴포넌트의 활성화(전체 노출) 여부 제어 플래그
 * @property {boolean} isMobile - 현재 브라우저 뷰포트 및 미디어 쿼리가 모바일 해상도 판정을 받았는지 여부
 * @property {object} target - 현재 선택된 채팅방 히스토리 모델의 로우 데이터 객체 (고유 ID, 제목, 고정 여부 등 캡슐화)
 * @property {HTMLElement|null} referenceEl - 데스크톱 렌더링 시 컨텍스트 메뉴가 부착될 기준점 컴포넌트 DOM 객체
 */
const props = defineProps({
  open: {type: Boolean, default: false},
  isMobile: {type: Boolean, default: false},
  target: {type: Object, default: null},
  referenceEl: {type: Object, default: null},
});

/**
 * @description 팝업 종료 및 최종 유저 클릭 액션 키를 상위로 전파하기 위한 뷰 커스텀 이벤트 채널 명세
 * @type {(event: 'close' | 'select', ...args: any[]) => void}
 */
defineEmits(["close", "select"]);

const {t} = useI18n(); // 다국어 변환 인스턴스 초기화
const menuRef = ref(null); // 텔레포트 내부의 데스크톱 컨텍스트 메뉴 쉘 DOM 엘리먼트 바인딩 포인터
const referenceRef = computed(() => props.referenceEl || null); // Floating UI가 감시할 타깃 기준점 엘리먼트의 컴퓨티드 래핑

// Floating UI 핵심 엔진 초기화 및 뷰포트 경계면 감지 미들웨어 패키징 선언
const {floatingStyles, update, x, y} = useFloating(referenceRef, menuRef, {
  placement: "right-start", // 기본 좌표를 기준점의 우측 상단 정렬로 앵커링
  strategy: "fixed", // 스크롤 시 부모 레이아웃의 컴포지션 스택 오버플로우를 회피하기 위해 fixed 레이어 전략 채택
  transform: false, // 하드웨어 가속 트랜스폼 대신 left/top 절대 좌표 계산 배치 유도
  whileElementsMounted: autoUpdate, // 화면 스크롤이나 요소 리사이즈 발생 시 자동으로 리포지셔닝 연산 수행
  middleware: [
    offset(8), // 타깃 버튼 엘리먼트와 8px의 물리적 이격 거리 확보
    flip({fallbackPlacements: ["left-start", "bottom-end"]}), // 화면 끝 우측 영역이 좁아 캔버스를 이탈할 경우 좌측이나 아래쪽 공간으로 대안 반전 배치
    shift({padding: 12}), // 플립된 상태에서도 브라우저 가시 화면 테두리 최소 12px 안쪽으로 박스 강제 밀어넣기(스퀴즈)
  ],
});

// 모바일 바텀시트 최종 노출 타이밍 연산 조건 조합
const mobileOpen = computed(() => props.open && props.isMobile);
// 데스크톱 컨텍스트 팝업 최종 노출 타이밍 연산 조건 조합
const desktopOpen = computed(() => props.open && !props.isMobile);
// Floating UI 연산이 완수되어 엘리먼트 배치가 물리적으로 마감되었음을 나타내는 트리거 플래그
const positionReady = ref(false);
// 해독된 x, y 좌표가 단순 null이나 언디파인드가 아닌 유효한 런타임 숫자 수치로 바인딩 완료되었는지 진단
const hasMeasuredPosition = computed(
  () => Number.isFinite(x.value) && Number.isFinite(y.value)
);

// 시각적 튐(Flickering) 현상을 제어하기 위해 인라인 렌더링 스타일을 실시간 연산 결합
const contextMenuStyle = computed(() => {
  const ready =
    desktopOpen.value && positionReady.value && hasMeasuredPosition.value;
  return {
    ...floatingStyles.value, // Floating UI 엔진이 제공하는 원시 유선 left/top 속성 디스트럭처링 복사
    position: "fixed",
    visibility: ready ? "visible" : "hidden", // 좌표가 0,0 등에 안착해 연산이 끝나는 시점 전까지 눈에 보이지 않도록 숨김 처리 가드
    pointerEvents: ready ? "auto" : "none", // 숨김 상태일 때는 하위 영역 클릭 이벤트가 투과되도록 비활성화 방어
  };
});

// 선택된 채팅방의 타이틀 텍스트를 파싱하되, 예외 상황으로 누락되었을 시 다국어 기본 타이틀 텍스트로 보정
const targetTitle = computed(
  () => props.target?.title || t("chat.historyMenu.title")
);

// 채팅방 상태 스냅샷에 의거하여 상단에 배치될 '상단 고정/고정 해제' 메뉴 아이템 배열을 가변 조립하는 컴퓨티드 영역
const actions = computed(() => {
  const pinAction = props.target?.isPinned
    ? {key: "unpin", label: t("chat.historyMenu.unpin"), icon: "☆"} // 상단 고정 상태일 때는 해제 기능 노출
    : {key: "pin", label: t("chat.historyMenu.pin"), icon: "★"}; // 일반 상태일 때는 상단 고정 기능 노출
  return [
    pinAction,
    {key: "rename", label: t("chat.historyMenu.rename"), icon: "✎"},
    {key: "share", label: t("chat.historyMenu.share"), icon: "↗"},
    {
      key: "delete",
      label: t("chat.historyMenu.delete"),
      icon: "🗑",
      danger: true, // 스타일 팩에서 위험/삭제 경고 붉은색(Danger)으로 가시 강조 처리를 처리하기 위한 옵션 마킹
    },
  ];
});

// [중요 가드 - 비동기 렌더링 타이밍 렌더 락 처리]:
// 데스크톱 메뉴가 켜지거나 기준 엘리먼트가 변경될 때, Vue 돔 트리에 텔레포트 노드가 마운트되는 순간과
// Floating UI의 기하학적 클라이언트 좌표 연산(getBoundingClientRect) 간의 미세한 타이밍 차이로 인한 리포지션 오차를
// 완전히 소멸시키기 위해 두 차례의 nextTick 큐 경계를 두고 강제 포지션 업데이트를 동기 순차 집행합니다.
watch(
  () => [desktopOpen.value, props.referenceEl],
  async () => {
    positionReady.value = false; // 연산 주기에 돌입하므로 먼저 가시성 락을 걸어 박스를 숨김
    if (!desktopOpen.value) return;

    await nextTick(); // 1차: v-if 조건부 컴포넌트 껍데기가 body 하위에 마운트되는 시점 확보
    await update?.(); // 1차 좌표 앵커 측정 계산 가동

    await nextTick(); // 2차: 자식 노드 엘리먼트들의 물리 구조 및 텍스트 폰트 가공이 정착되는 시점 확보
    await update?.(); // 최종 확정 좌표 계산 마감 보정

    positionReady.value = hasMeasuredPosition.value; // 최종 결과 수치가 유효하면 컴포넌트 안착 사인 점등 및 렌더링 락 해제
  },
  {flush: "post"} // 데이터가 변경된 후 Vue의 내부 돔 패치가 전격 마감된 시점에 이 감시자를 실행하도록 포스트 옵션 체결
);

// 상위 컴포넌트나 외부 컨텍스트 영역에서 포커싱 포인터 제어나 메뉴 돔 타깃을 직접 참조할 수 있도록 내부 참조 객체 노출 명세 선언
defineExpose({menuRef});
</script>
