import {nextTick, ref} from "vue";
import {isGenerationAbortError, streamGeneration} from "@/api/sse/sse";
import {fetchGenerationResult} from "@/api/sse/generationResultApi";
import {logWarn} from "@/utils/logger";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {createId} from "@/utils/id";

/**
 * 사용자가 입력한 프롬프트 텍스트 및 첨부 파일 배열 데이터를 안정적인 객체 규격으로 단문화(Normalization)합니다.
 * @param {string|Object} payload - 입력 폼으로부터 수신한 날것의 문자열 혹은 데이터 객체
 * @returns {Object} 정규화가 완료된 텍스트 및 첨부파일 배열 묶음
 */
function normalizePromptPayload(payload) {
  // 인자 형식이 단순 텍스트 문자열이라면 공백을 제거하고 첨부파일을 빈 배열로 세팅하여 리턴합니다.
  if (typeof payload === "string")
    return {text: payload.trim(), attachments: []};

  // 객체 형식이라면 각 속성을 안전하게 캐스팅하여 구조를 고정합니다.
  return {
    text: String(payload?.text || "").trim(),
    attachments: Array.isArray(payload?.attachments) ? payload.attachments : [],
  };
}

/**
 * 네트워크 고유 트래킹 및 정합성 검증을 위한 UUID 형태의 request_id를 가공하여 통신용 페이로드를 생성합니다.
 * @param {Object} [base={}] - 요청에 실어 보낼 비즈니스 파라미터 소스 객체
 * @returns {Object} 고유 요청 식별자가 탑재된 전송용 페이로드
 */
function createRequestPayload(base = {}) {
  // 유틸리티 함수를 이용해 고유한 요청 식별 키를 생성합니다.
  const requestId = createId("request");
  return {
    request_id: requestId, // 백엔드 스펙에 맞춘 언더스코어 키
    requestId, // 카멜케이스 키 동시 제공
    ...base, // 기본 비즈니스 파라미터 병합
  };
}

/**
 * 대형 언어 모델(LLM)이 본격적인 답변 도출 전에 가동하는 '생각 프로세스(Reasoning)'를 화면에 시뮬레이션하기 위한 가짜 데이터 템플릿을 빌드합니다.
 * @param {Object} normalized - 정문화된 유저 데이터 정보
 * @returns {string} 마크다운 형태의 생각 도출 프로세스 텍스트 본문
 */
function buildMockReasoningContent(normalized) {
  const target = normalized.text || "첨부 기반 요청";
  return `사용자 요청을 먼저 분해하고 답변에 필요한 항목을 정리했습니다.\n\n- 요청: ${target}\n- Assistant/Model payload를 생성했습니다.\n- 스트림 응답이 완료되기 전까지 메시지 액션은 숨김 처리됩니다.`;
}

/**
 * 현재 브라우저 탭 화면이 사용자에 의해 완전히 가려지거나 백그라운드 탭으로 내려간 상태(숨김 상태)인지 여부를 판단합니다.
 * @returns {boolean} 백그라운드 비활성화 상태이면 true, 활성 포그라운드면 false
 */
function isDocumentHidden() {
  return typeof document !== "undefined" && document.hidden;
}

/**
 * 사용자가 다른 브라우저 탭을 보거나 화면을 내려 네트워크 유실이 염려될 때, 백엔드 최종 생성 완결 저장소로부터 실시간 유실분을 재동기화하여 확보합니다.
 * @param {string} requestId - 유실 추적 대상이 되는 고유 요청 ID
 * @returns {Promise<string>} 동기화가 완료된 최종 텍스트 본문 (실패 시 빈 값)
 * @see {@link fetchGenerationResult} 완결 데이터 조회를 전담하는 전용 백엔드 API 모듈
 */
async function resolveGenerationResultContent(requestId) {
  try {
    const result = await fetchGenerationResult(requestId);
    // 서버 규격 파편화에 대응하여 유효 데이터 속성을 순차적으로 풀링합니다.
    return result?.content || result?.answer || result?.data || "";
  } catch (error) {
    logWarn("[useChatSubmit] generation result sync failed:", error);
    return "";
  }
}

/**
 * [성능 최적화 스케줄러] SSE 스트리밍 도중 과도하게 발생하는 DOM 렌더링에 의한 브라우저 락(Lock)을 방지하는 유틸리티입니다.
 * 특히 디바이스가 백그라운드 모드 상태일 때는 스크롤 타깃 예약 행위를 철저히 차단하여 하드웨어 부하를 막아줍니다.
 * @param {Object} options - 최하단 화면 이동 제어 스크롤 훅 매커니즘 묶음
 * @returns {Function} 실행 차단 기능(Throttle)이 부여된 스크롤 렌더링 스케줄러 함수
 */
function createStreamScrollScheduler(options) {
  let pending = false; // 현재 스크롤 이벤트가 틱(Tick) 상에서 대기 중인지 타내는 내부 상태 락 변수

  return () => {
    // 이미 스크롤 처리가 틱에 예약되어 있거나 화면이 보이지 않는 비활성 탭 상태라면 스크롤 동작을 조기 차단합니다.
    if (pending || isDocumentHidden()) return;

    pending = true; // 대기 락을 활성화합니다.

    // 마이크로태스크 큐(Microtask Queue) 비동기 스케줄링을 발동합니다.
    Promise.resolve()
      .then(async () => {
        pending = false; // 진입 순간 락을 해제합니다.

        if (isDocumentHidden()) return; // 비동기 대기 도중 화면이 숨김 처리되었다면 스크롤을 생략합니다.

        await nextTick(); // Vue가 가상 DOM 트리를 실제 화면 레이아웃에 완전히 반영(Paint)할 때까지 대기합니다.

        if (isDocumentHidden()) return;

        // 최종 검증을 통과하면 비로소 화면을 아래로 지속 갱신 스크롤합니다.
        await options.scrollBottom({
          force: true,
          stable: true,
          autoAnswer: true,
        });
      })
      .catch((error) => {
        pending = false;
        logWarn("[useChatSubmit] stream scroll failed:", error);
      });
  };
}

/**
 * AI 답변의 첫 번째 조각(Chunk)이 전송되어 도달하는 시점에 기존의 '생각 중(Thinking)' 상태 레이아웃을 '답변 송출 중(Streaming)' 모드로 매끄럽게 스위칭합니다.
 * @param {Object} context - 컴포넌트 뷰 상태 연동 컨텍스트
 */
async function commitFirstAnswerChunk({
  content,
  liveAssistantMessage,
  commitAssistantMessage,
}) {
  // 어시스턴트 메시지 상태가 여전히 최초 '생각 중' 상태에 머물러 있다면 완료 상태로 매핑 변경합니다.
  if (liveAssistantMessage.reasoningStatus === "thinking") {
    commitAssistantMessage({reasoningStatus: "completed"});
    await nextTick(); // 상태 변경 레이아웃 업데이트 반영 대기
  }

  // 데이터 내용물을 반영하고 스트리밍 진행 중 플래그로 갱신을 지속 선언합니다.
  commitAssistantMessage({content, status: "streaming"});
}

/**
 * 유저가 메시지를 최종 발송한 직후, 옵션 세팅값(자동 스크롤 켜짐 여부)에 근거하여 알맞은 스크롤 초점을 잡아주는 유틸입니다.
 * @param {Object} options - 스크롤 행위 제어 인터페이스 객체
 */
async function scrollAfterUserSubmit(options) {
  await nextTick(); // 유저 메시지가 DOM에 그려질 때까지 대기

  // 사용자가 답변 시 자동 스크롤 추적 옵션을 켜둔 상태라면 최하단 강제 포커스를 실행합니다.
  if (options.autoScrollOnAnswer?.value) {
    await options.scrollBottom({force: true, stable: true, autoAnswer: true});
    return;
  }

  // 자동 스크롤 옵션이 꺼져 있다면, 방금 유저가 작성한 질문 말풍선 시작 지점으로 화면 스크롤 포커스를 보정 이동시킵니다.
  await options.scrollLatestUserMessage?.({
    behavior: "auto",
    stable: true,
    offset: 16,
  });
}

/**
 * 채팅 서비스 대화방 내부에서 실시간 프롬프트 발송, 취소, 에러 예외 복구 및 재생성을 전담하는 융합 비즈니스 훅입니다.
 * @param {Object} options - {@link useChatContainerController} 등 마스터 레이어에서 인젝션된 상태 조율 공유 인터페이스
 * @returns {Object} 뷰 컴포넌트 전송 서브밋과 연결할 `isGenerating`, `handleSubmit`, `regenerateResponse` 제어 셋
 */
export function useChatSubmit(options) {
  // 현재 문장이 스트리밍 방식으로 생성되고 있는 중인지를 나타내는 로컬 반응형 상태값입니다.
  const isGenerating = ref(false);
  // 전체 레이아웃 CSS 및 프로그래스바 제어를 통합 연동하기 위해 전역 스트림 Pinia 스토어를 로드합니다.
  const chatStreamStore = useChatStreamStore();

  /**
   * [액션 1] 새로운 프롬프트 메시지 패키지를 최종 발송 처리합니다.
   * @param {string|Object} payload - 입력 폼에서 전달받은 텍스트 및 첨부 데이터 묶음
   */
  async function handleSubmit(payload) {
    // 데이터 포맷을 정규화합니다.
    const normalized = normalizePromptPayload(payload);
    // 아무 내용도 없거나 이미 다른 문장이 생성 중인 상태라면 오작동 방지를 위해 전송 처리를 무시합니다.
    if (
      (!normalized.text && normalized.attachments.length === 0) ||
      isGenerating.value
    )
      return;

    // 현재 진입 중인 라우터 URL 경로 파라미터로부터 고유 히스토리 대화방 ID를 수집합니다.
    let targetHistoryId = String(options.route.params.id || "");

    // 만약 완전히 첫 진입 화면('main' 등)이어서 방 ID가 아직 발급되지 않은 상태라면 신규 대화방 개설 공정을 밟습니다.
    if (
      options.route.name === "main" ||
      options.route.name === "chat-entry" ||
      !targetHistoryId
    ) {
      const assistantId = options.selectedAssistantId?.value || "";
      const modelId = options.selectedModel?.value || "";

      // 상위 컨트롤러의 대화방 생성 API 함수를 호출하여 최초 신규 대화 이력을 백엔드에 빌드합니다.
      const history = await options.createConversation(normalized, {
        assistantId,
        modelId,
      });
      targetHistoryId = history.id; // 신규 발급된 고유 대화방 ID 선점

      // 발급된 신규 대화방 전용 상세 주소 URL 경로로 화면을 라우터 강제 이동 처리합니다.
      await options.router
        .push({name: "chat", params: {id: targetHistoryId}})
        .catch(() => {});
      await nextTick();
    }

    // 화면에 즉시 유저 질문 문장과 AI의 빈 답변 대기 말풍선을 리액티브 배열에 밀어 넣습니다. (Optimistic UI 패턴)
    const {messages, assistantMessage} = options.appendUserAndAssistantMessages(
      targetHistoryId,
      normalized
    );
    options.syncHistories?.(); // 사이드바 대화방 리스트 최신화 동기화

    let liveMessages = messages;
    // 인메모리 상에서 실시간으로 갱신해나갈 로컬 어시스턴트 메시지 버퍼 객체를 빌드합니다.
    let liveAssistantMessage = {
      ...assistantMessage,
      status: "streaming",
      reasoningContent: buildMockReasoningContent(normalized), // 초기 가상 생각 프로세스 할당
      reasoningStatus: "thinking",
    };

    // 이 턴에 가동할 최적화된 화면 스크롤 제어용 스케줄러 함수를 빌드합니다.
    const scheduleStreamScroll = createStreamScrollScheduler(options);

    // 내부 스냅샷 데이터를 Vue 반응형 리스트 요소 원본에 강제 동기화 갱신(Commit)해 주는 서브 함수입니다.
    function commitAssistantMessage(patch = {}) {
      liveAssistantMessage = {...liveAssistantMessage, ...patch};
      liveMessages = liveMessages.map((message) =>
        message.id === liveAssistantMessage.id ? liveAssistantMessage : message
      );
      options.messages.value = liveMessages; // 상위 원본 ref 배열 교체
      options.setConversation(targetHistoryId, liveMessages); // 로컬 스토리지 또는 캐시 레이어 동시 보존
    }

    // 최초 빈 슬롯 상태를 한 번 화면에 커밋합니다.
    commitAssistantMessage();
    // 유저 전송 시점에 걸맞은 타깃 스크롤 위치 조정을 가동합니다.
    await scrollAfterUserSubmit(options);

    isGenerating.value = true;
    chatStreamStore.start(); // 글로벌 상단 프로그래스바 애니메이션 구동

    try {
      // API 통신용 SSE 모듈을 최종 기동하여 네트워크 연결을 체결합니다.
      await streamGeneration(
        createRequestPayload({
          assistantId: options.selectedAssistantId?.value || "",
          modelId: options.selectedModel?.value || "",
          input: normalized.text,
          chatId: targetHistoryId,
        }),
        {
          // 데이터 패킷 조각(Chunk)이 라인을 타고 도달할 때마다 실행되는 실시간 콜백 리스너입니다.
          onChunk: async (content) => {
            await commitFirstAnswerChunk({
              content,
              liveAssistantMessage,
              commitAssistantMessage,
            });
            scheduleStreamScroll(); // 스케줄러에게 안전한 스크롤 갱신 명령 토스
          },
          // 끊김 없이 깔끔하게 스트리밍 전송이 물리적으로 도달 완결된 경우의 리스너입니다.
          onComplete: () => {
            commitAssistantMessage({
              status: "complete",
              reasoningStatus: "completed",
            });
          },
        }
      );

      // 스트림 완전 종료 후 상태 확정 처리 코드를 수행합니다.
      commitAssistantMessage({
        status: "complete",
        reasoningStatus: "completed",
      });
      await nextTick();
      await options.renderAfterStream(); // 스트리밍 마감 후 하이라이트팅 및 부가 UI 후처리 가동
    } catch (error) {
      // [예외 케이스 A] 유저가 인위적으로 생성 중단(Stop Generating) 버튼을 누른 경우
      if (isGenerationAbortError(error)) {
        logWarn("[useChatSubmit] 스트리밍이 중단되었습니다:", error);

        // 백엔드 정합성 보존 채널을 통해 그 시점까지 생성된 실제 데이터를 긴급 확보(Pulling)합니다.
        const syncedContent = await resolveGenerationResultContent(
          error.generationRequestId
        );
        // 서버 유실분 텍스트 -> 에러 객체에 적립된 가동 텍스트 -> 기존 메모리 텍스트 순으로 대체 폴백을 선별합니다.
        const fallbackContent =
          syncedContent ||
          error.accumulated ||
          liveAssistantMessage.content ||
          "(응답 생성이 중단되었습니다.)";

        commitAssistantMessage({
          status: fallbackContent ? "complete" : "error",
          reasoningStatus: "completed",
          content: fallbackContent,
        });
      } else {
        // [예외 케이스 B] 네트워크 끊김이나 서버 타임아웃 등 실제 시스템 인프라 장애 오류가 발생한 경우
        logWarn("[useChatSubmit] 스트리밍 오류:", error);
        const syncedContent = await resolveGenerationResultContent(
          error.generationRequestId
        );
        const fallbackContent =
          syncedContent ||
          error.accumulated ||
          liveAssistantMessage.content ||
          "(응답 생성 중 오류가 발생했습니다.)";

        commitAssistantMessage({
          status: fallbackContent ? "complete" : "error",
          reasoningStatus: "completed",
          content: fallbackContent,
        });
      }
    } finally {
      // 정상 성공 혹은 실패 여부와 상관없이 무조건 최종 제어 상태 플래그 락들을 원복 해제합니다.
      isGenerating.value = false;
      chatStreamStore.finish(); // 프로그래스바 중지
    }
  }

  /**
   * [액션 2] 특정 과거 답변 말풍선 시점 아래 항목들을 갱신하고 동일 질문 기반으로 AI 답변을 전면 재출력(Regenerate)합니다.
   * @param {Object} [message={}] - 유저가 재생성 아이콘을 누른 타깃 어시스턴트 메시지 원본 객체
   */
  async function regenerateResponse(message = {}) {
    if (isGenerating.value) return;
    const targetHistoryId = String(options.route.params.id || "");
    if (!targetHistoryId) return;

    const currentMessages = Array.isArray(options.messages.value)
      ? options.messages.value
      : [];
    // 재생성 대상 어시스턴트 말풍선의 인덱스 위치를 찾습니다.
    const assistantIndex = currentMessages.findIndex(
      (item) => item.id === message.id
    );
    if (assistantIndex <= 0) return; // 최상단에 에러 유실이 없다면 인덱스는 최소 1 이상이어야 유효합니다.

    // 해당 어시스턴트 말풍선 바로 위에 위치했던 유저의 실제 원본 질문(User Role) 객체를 역추적하여 색출합니다.
    const userMessage = [...currentMessages]
      .slice(0, assistantIndex)
      .reverse()
      .find((item) => item.role === "user");
    if (!userMessage) return;

    // 원본 유저 프롬프트 정보를 안전하게 복원 추출 정규화합니다.
    const normalized = normalizePromptPayload({
      text: userMessage.content,
      attachments: userMessage.attachments || [],
    });

    // 다시 새로 그릴 완전히 깨끗한 새 AI 어시스턴트 빈 메시지 스펙을 생성합니다.
    const assistantMessage = {
      id: createId("message"),
      role: "assistant",
      content: "",
      reasoningContent: buildMockReasoningContent(normalized),
      reasoningStatus: "thinking",
      status: "streaming",
      createdAt: new Date().toISOString(),
    };

    // 과거 대상 어시스턴트 하위의 대화 기록은 과감히 도려내고(slice), 새로 정립한 가상 어시스턴트 빈 객체로 꼬리를 새로 붙입니다.
    let liveMessages = [
      ...currentMessages.slice(0, assistantIndex),
      assistantMessage,
    ];
    let liveAssistantMessage = assistantMessage;
    const scheduleStreamScroll = createStreamScrollScheduler(options);

    function commitAssistantMessage(patch = {}) {
      liveAssistantMessage = {...liveAssistantMessage, ...patch};
      liveMessages = liveMessages.map((item) =>
        item.id === liveAssistantMessage.id ? liveAssistantMessage : item
      );
      options.messages.value = liveMessages;
      options.setConversation(targetHistoryId, liveMessages);
    }

    // 재생성 시작 시점 메시지를 즉각 화면에 고정 반영합니다.
    commitAssistantMessage();
    await nextTick();
    await options.scrollBottom({force: true, stable: true, autoAnswer: true});

    // 하부 영역은 상기 일반 handleSubmit 처리 구간과 완전히 동일한 SSE 스트리밍 사이클을 관통 구동합니다.
    isGenerating.value = true;
    chatStreamStore.start();
    try {
      await streamGeneration(
        createRequestPayload({
          assistantId: options.selectedAssistantId?.value || "",
          modelId: options.selectedModel?.value || "",
          input: normalized.text,
          chatId: targetHistoryId,
        }),
        {
          onChunk: async (content) => {
            await commitFirstAnswerChunk({
              content,
              liveAssistantMessage,
              commitAssistantMessage,
            });
            scheduleStreamScroll();
          },
          onComplete: () => {
            commitAssistantMessage({
              status: "complete",
              reasoningStatus: "completed",
            });
          },
        }
      );
      commitAssistantMessage({
        status: "complete",
        reasoningStatus: "completed",
      });
      await nextTick();
      await options.renderAfterStream();
    } catch (error) {
      if (isGenerationAbortError(error)) {
        logWarn("[useChatSubmit] 재생성 스트리밍이 중단되었습니다:", error);
        const syncedContent = await resolveGenerationResultContent(
          error.generationRequestId
        );
        const fallbackContent =
          syncedContent ||
          error.accumulated ||
          liveAssistantMessage.content ||
          "(응답 재생성이 중단되었습니다.)";
        commitAssistantMessage({
          status: fallbackContent ? "complete" : "error",
          reasoningStatus: "completed",
          content: fallbackContent,
        });
      } else {
        logWarn("[useChatSubmit] 재생성 스트리밍 오류:", error);
        const syncedContent = await resolveGenerationResultContent(
          error.generationRequestId
        );
        const fallbackContent =
          syncedContent ||
          error.accumulated ||
          liveAssistantMessage.content ||
          "(응답 재생성 중 오류가 발생했습니다.)";
        commitAssistantMessage({
          status: fallbackContent ? "complete" : "error",
          reasoningStatus: "completed",
          content: fallbackContent,
        });
      }
    } finally {
      isGenerating.value = false;
      chatStreamStore.finish();
    }
  }

  // 컴포넌트 템플릿 영역 혹은 하단 전송 프롬프트 바 컴포넌트에서 바인딩 가능하도록 최종 인터페이스 유틸을 토스합니다.
  return {isGenerating, handleSubmit, regenerateResponse};
}
