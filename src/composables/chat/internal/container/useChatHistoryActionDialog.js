/**
 * @file composables/chat/internal/container/useChatHistoryActionDialog.js
 * @description ChatContainer 전용 controller 계층입니다. route, UI 상태, scroll, modal, submit 흐름을 도메인별 composable로 조립합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {computed, ref} from "vue";
import {logWarn} from "@/utils/logger";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {ROUTE_NAMES} from "@/constants/routeNames";
import {useNavigationLock} from "@/composables/navigation/useNavigationLock";

/**
 * @typedef {object} ChatHistoryActionDialogDependencies
 * @property {function(string, object=): string} t - 다국어 번역 언어팩 인터페이스 핸들러 함수
 * @property {object} router - 페이지 전환 및 주소창 조작을 위한 Vue Router 인스턴스
 * @property {import('vue').Ref<Array>} messages - 현재 활성화된 채팅방의 메시지 타임라인 데이터 배열 반응형 모델
 * @property {import('vue').Ref<string|number>} activeHistoryId - 현재 사용자가 진입해 보고 있는 활성 채팅방 고유 ID 식별자
 * @property {function(object): Promise<void>} toggleHistoryBookmark - 채팅방 중요 항목(북마크/핀) 설정 및 해제를 유발하는 비동기 서비스 액션
 * @property {function(object, string): Promise<void>} renameHistory - 채팅방의 타이틀 제목 명칭을 변경하는 비동기 서비스 액션
 * @property {function(object): Promise<void>} removeHistory - 채팅방 데이터를 데이터베이스 및 리스트에서 완전히 소멸시키는 비동기 서비스 액션
 * @property {function(object=): void} [syncHistoriesInBackground] - 로컬 정합성이 깨지는 것을 방지하기 위해 백그라운드 단에서 리스트를 재조회(폴링/싱크)하는 동기화 유틸 함수
 */

/**
 * @description 채팅방 관리 액션 메뉴(수정, 삭제, 고정, 공유 등)에 대응하여, 사용자 확인 유도 다이얼로그 모달 상태 및 동기화 비동기 파이프라인 흐름을 격리 관리하는 비즈니스 로직 제어 훅입니다.
 * @param {ChatHistoryActionDialogDependencies} dependencies - 도메인 상위 및 서비스 레이어에서 주입해 주는 비동기 제어 함수 묶음
 * @returns {object} 다이얼로그 및 토스트 알림 템플릿 영역에 유선 바인딩할 상태 제어 패키지
 */
export function useChatHistoryActionDialog({
  t,
  router,
  messages,
  activeHistoryId,
  toggleHistoryBookmark,
  renameHistory,
  removeHistory,
  syncHistoriesInBackground,
}) {
  // LLM AI 답변이 실시간 생성 중(Streaming)인지 상태를 확인하여 메뉴 조작 난입을 원천 차단하기 위한 전역 스트림 스토어 바인딩
  const chatStreamStore = useChatStreamStore();
  const {NAVIGATION_LOCK_SCOPES, releaseLock} = useNavigationLock();

  // 수정/삭제 범용 다이얼로그 모달의 시각적 노출 토글 플래그
  const historyDialogOpen = ref(false);
  // 어떤 기능 팝업을 띄울지 구분하는 모드 지시자 플래그 ("rename" | "delete")
  const historyDialogMode = ref("rename");
  // 사용자가 액션 버튼을 눌러 현재 도마 위에 올라와 조작 타깃이 된 특정 채팅방 로우 데이터 스냅샷
  const historyDialogTarget = ref(null);

  // 공유하기 링크 복사 등 단순 안내성 하단 알림창(Notice 토스트/스낵바)의 시각적 노출 토글 플래그
  const historyNoticeOpen = ref(false);
  // 안내 팝업창 내부에 동적으로 출력해 줄 텍스트 본문 문구 문자열
  const historyNoticeMessage = ref("");

  // 다이얼로그 모드 상태에 발맞추어 상단 헤더 타이틀 문구를 다국어 팩과 동적 연동 결합
  const historyDialogTitle = computed(() =>
    historyDialogMode.value === "delete"
      ? t("chat.historyDialog.deleteTitle")
      : t("chat.historyDialog.renameTitle")
  );

  // 삭제 모드일 때 유저의 최종 인지를 돕기 위해 타깃 채팅방의 원래 제목을 다국어 인자로 결합 치환하여 경고 문구 생성
  const historyDialogMessage = computed(
    () =>
      historyDialogMode.value === "delete"
        ? t("chat.historyDialog.deleteMessage", {
            title:
              historyDialogTarget.value?.title ||
              t("chat.historyDialog.selectedConversation"),
          })
        : "" // 이름 변경(Rename) 국면에서는 인풋 박스(Input Text Area)가 본문을 대신하므로 빈 문자열 마킹
  );

  /**
   * @description 열려 있던 조작 모달의 플래그를 정지시키고 록인되어 있던 타깃 채팅방 메모리를 리셋 소멸 수거합니다.
   */
  function closeHistoryDialog() {
    historyDialogOpen.value = false;
    historyDialogTarget.value = null;
  }

  /**
   * @description 사용자가 다이얼로그 하단 '확인' 버튼을 전격 클릭하여 실질적인 비동기 데이터 수정/삭제 작업을 인보크(Invoke)했을 때 집행되는 액션 완수 처리기입니다.
   * @param {string} [value] - 이름 변경 모드일 때 유저가 인풋 폼에 새로 타이핑하여 넘겨준 텍스트 타이틀 문자열 명세
   * @returns {Promise<void>}
   */
  async function confirmHistoryDialog(value) {
    // 레이스 컨디션 방어 가드 1: AI가 실시간으로 채팅 답변을 한창 타이핑 스트리밍 중인 경우 백엔드 정합성 붕괴를 방어하기 위해 조작을 전면 무효화 처리
    if (chatStreamStore.isStreaming) return;

    const target = historyDialogTarget.value;
    // 예외 방어 가드 2: 비동기 처리 타이밍 이슈 등으로 인해 타깃 오브젝트가 소멸 유실된 상태라면 파이프라인을 중단하고 모달 폐쇄
    if (!target) {
      closeHistoryDialog();
      return;
    }

    try {
      // 케이스 A: 이름 변경(Rename) 프로세스 진행
      if (historyDialogMode.value === "rename") {
        const nextTitle = String(value || "").trim();
        if (!nextTitle) return; // 사용자가 공백문자만 입력했거나 빈 값으로 보냈을 때 무시 처리 거부 가드
        await renameHistory(target, nextTitle); // 서비스 레이어의 API 통신 유도 호출 후 리스트 반영

        // 케이스 B: 데이터 제거(Delete) 프로세스 진행
      } else if (historyDialogMode.value === "delete") {
        await removeHistory(target); // 서비스 레이어에 영구 제거 비동기 요청 위임

        // [중요 비즈니스 가드 로직]: 만약 방금 삭제 완수 처리한 채팅방이 하필이면 사용자가 현재 주소창에 주입해 '보고 있던 바로 그 채팅방'인 경우,
        // 잔존 화면이 굳어 유령 데이터를 보지 않도록 메모리 타임라인 메시지 풀을 증발 비우고 전역 메인 루트 화면으로 강제 이탈 페이지 전환 처리 감행
        if (String(activeHistoryId.value) === String(target.id)) {
          messages.value = [];
          releaseLock(NAVIGATION_LOCK_SCOPES.chatHistory);
          await router.replace({name: ROUTE_NAMES.MAIN}).catch(() => {}); // 라우팅 중복 에러 전파 방어 가드 체결
          releaseLock(NAVIGATION_LOCK_SCOPES.chatHistory);
        }
      }
    } catch (error) {
      logWarn("[useChatHistoryActionDialog] confirmHistoryDialog 오류:", error); // 트래킹 및 모니터링을 위한 개발 경고 로깅
    } finally {
      closeHistoryDialog(); // 정상 완수든 서버 크래시든 최종 단계에서는 예외 없이 다이얼로그 모달 오버레이 차단 락 탈거
    }
  }

  /**
   * @description 하부 자식 컨텍스트 메뉴 컴포넌트(`ChatHistoryContextMenu.vue`) 단에서 실시간 클릭 전파되어 올라온 최종 액션 키와 타깃 모델을 해독하여 알맞은 모달 및 상태 팩토리로 트래픽 라우팅을 집행합니다.
   * @param {object} [param0={}] - 디스트럭처링 수신 패킷 객체
   * @param {string} param0.action - 구동하고자 하는 기능 명칭 코드 식별자 ("pin" | "unpin" | "rename" | "share" | "delete")
   * @param {object} param0.history - 사용자가 마우스를 올리거나 지정한 타깃 채팅방 엔티티 로우 원본 객체
   * @returns {Promise<void>|void}
   */
  async function handleHistoryMenuAction({action, history} = {}) {
    // 글로벌 락인 가드: 현재 AI 답변이 출력 중인 긴박한 시점에서는 사용자의 우클릭 서브 액션 발동 시도를 원천 무력화 처리
    if (chatStreamStore.isStreaming) return;
    if (!history || !action) return; // 안전 탈출 조건

    // 동기화 가드: 사용자가 액션 메뉴창을 활성화한 순간, 혹여나 다른 탭이나 모바일 기기에서 조작된 내역과 간극이 발생하지 않도록 비동기 백그라운드 리스트 정렬 갱신 가동
    syncHistoriesInBackground?.({notifyOnError: true});

    // 라우팅 분기 1: 최상단 고정 / 고정 해제 액션 처리 (다이얼로그 모달을 건너뛰고 서비스 비동기 함수 즉각 다이렉트 엑츄에이션)
    if (action === "pin" || action === "unpin") {
      try {
        await toggleHistoryBookmark(history);
      } catch (error) {
        logWarn(
          "[useChatHistoryActionDialog] toggleHistoryBookmark 오류:",
          error
        );
      }
      return; // 단발성 상태 스위칭이므로 핸들러 조기 종결
    }

    // 라우팅 분기 2: 이름 변경 액션 처리
    if (action === "rename") {
      historyDialogTarget.value = history; // 조작 기준점 오브젝트 록인
      historyDialogMode.value = "rename"; // 이름 수정 전용 모드 전환
      historyDialogOpen.value = true; // 범용 모달 팝업 개통
      return;
    }

    // 라우팅 분기 3: 공유하기 링크 추출 액션 처리
    if (action === "share") {
      syncHistoriesInBackground?.({notifyOnError: true});
      historyNoticeMessage.value = t("chat.historyDialog.shareSelected"); // 안내 문구 셋업
      historyNoticeOpen.value = true; // 토스트 형태의 가벼운 알림 레이어 개통 노출
      return;
    }

    // 라우팅 분기 4: 삭제 확인 모달 액션 처리
    if (action === "delete") {
      historyDialogTarget.value = history; // 조작 기준점 오브젝트 록인
      historyDialogMode.value = "delete"; // 삭제 가이드 및 경고 전용 모드 전환
      historyDialogOpen.value = true; // 범용 모달 팝업 개통
    }
  }

  // 템플릿 마운트부 및 부모 지휘 컴포넌트(`ChatContainer.vue`) 단에서 뷰 컨텍스트와 동기 결합할 인터페이스 패키지 방출 반환
  return {
    historyDialogOpen,
    historyDialogMode,
    historyDialogTarget,
    historyDialogTitle,
    historyDialogMessage,
    historyNoticeOpen,
    historyNoticeMessage,
    closeHistoryDialog,
    confirmHistoryDialog,
    handleHistoryMenuAction,
  };
}
