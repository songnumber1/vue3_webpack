import {nextTick, ref} from "vue";
import {isGenerationAbortError, streamGeneration} from "@/api/sse/sse";
import {fetchGenerationResult} from "@/api/sse/generationResultApi";
import {logWarn} from "@/utils/logger";
import {useChatStreamStore} from "@/stores/chatStreamStore";
import {createId} from "@/utils/id";

/**
 * [순수 유틸리티] 유저가 입력한 원시 페이로드(단순 스트링 vs 첨부파일 포함 객체)의 타입을 단일 정형화 규격으로 변환합니다.
 * @param {string|Object} payload - 입력창으로부터 넘어온 순수 문자열 혹은 믹스드 객체
 * @returns {Object} { text: string, attachments: Array } 양식의 클린 오브젝트
 */
function normalizePromptPayload(payload) {
  if (typeof payload === "string") {
    return {text: payload.trim(), attachments: []};
  }

  return {
    text: String(payload?.text || "").trim(),
    attachments: Array.isArray(payload?.attachments) ? payload.attachments : [],
  };
}

/**
 * [순수 유틸리티] 네트워크 추적성 확보 및 중복 패킷 전송 결함 방지를 위한 프론트엔드 자체 고유 발급 ID 메타데이터를 주입합니다.
 */
function createRequestPayload(base = {}) {
  const requestId = createId("request");
  return {
    request_id: requestId,
    requestId,
    ...base,
  };
}

/**
 * [도메인 판별 검증식] 현재 셀렉트 박스에서 선택된 LLM 마스터 모델이 깊은 사고 과정을 지원하는 '추론형 모델(Reasoning Model)' 인지 여부를 판별합니다.
 */
function isSelectedModelReasoning(options) {
  const modelId = options.selectedModel?.value || "";
  const models = Array.isArray(options.models?.value)
    ? options.models.value
    : [];
  const selected = models.find((model) => model.id === modelId);

  return Boolean(selected?.isReasoning);
}

/**
 * [상태 팩토리 파일럿] 스트리밍이 기동되는 초동 시점, 어시스턴트 말풍선 내부에 바인딩할 실시간 상태 플래그 셋을 생성합니다.
 * 추론형 모델인 경우 생각하는 중(`thinking`) 단계를 먼저 개통시킵니다.
 */
function createAssistantStreamingPatch(isReasoning) {
  return {
    status: "streaming",
    isReasoning,
    reasoningContent: "",
    reasoningStatus: isReasoning ? "thinking" : "completed",
  };
}

/**
 * [브라우저 성능 최적화 힌트] 현재 사용자가 탭을 전환하여 대화창 화면이 시야에서 가려졌는지(Hidden) 여부를 체크합니다.
 */
function isDocumentHidden() {
  return typeof document !== "undefined" && document.hidden;
}

/**
 * [보안 권한 밸리데이션] 현재 대화창이 읽기 전용 상태이거나 기 가동 모델이 차단/유실 상태여서 타이핑 전송을 집행할 수 없는지 검증 가드합니다.
 */
function canWrite(options) {
  if (typeof options.canWrite === "function") return options.canWrite();
  if (options.isReadOnly?.value) return false;
  if (options.isActiveModelUnavailable?.value) return false;
  return true;
}

/**
 * @function resolveGenerationResultContent
 * @description [장애 복구 보정 파트] HTTP SSE 스트리밍이 불안정한 와이파이 환경 등으로 도중 단절되었을 때,
 * 백엔드 데이터베이스에 최종 정상 적치 완결되었을지 모르는 완전한 대화 본문을 REST API로 역추적 패치해 오는 안전 가드 함수입니다.
 */
async function resolveGenerationResultContent(requestId) {
  try {
    const result = await fetchGenerationResult(requestId);
    return result?.content || result?.answer || result?.data || "";
  } catch (error) {
    logWarn("[useChatSubmit] generation result sync failed:", error);
    return "";
  }
}

/**
 * @function createStreamScrollScheduler
 * @description [마이크로태스크 배치 스케줄러] 데이터 토큰 조각이 들어올 때마다 매번 동기식 돔 스크롤을 튕기면 브라우저가 터지는 현상(Layout Thrashing)이 발생합니다.
 * Promise microtask 큐를 활용해 한 프레임에 단 한 번만 최하단 스크롤 연산이 예약 집행되도록 디바운싱 조율합니다.
 */
function createStreamScrollScheduler(options) {
  let pending = false;

  return () => {
    // 이미 다음 프레임 연산이 예약되어 있거나 화면이 백그라운드 탭으로 내려간 상태라면 불필요한 레이아웃 연산을 무시 차단합니다.
    if (pending || isDocumentHidden()) return;

    pending = true;
    Promise.resolve()
      .then(async () => {
        pending = false;
        if (isDocumentHidden()) return;

        await nextTick(); // Vue 3 가상 돔 렌더링 타이밍 대기 동기화
        if (isDocumentHidden()) return;

        // UI 제어반을 향해 최하단 스크롤 갱신 명령을 안전하게 안전 송출합니다.
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
 * @function createAssistantMessageCommitter
 * @description [불변성 데이터 커미터 클로저] 특정 대화방 내부의 메시지 배열 레퍼런스를 훼손하지 않으면서,
 * 어시스턴트가 뿜어내는 글자 패치 조각을 깊은 복사 결합 구조로 갱신하고 상위 Pinia 상태 저장소에 동기화 처리를 대행합니다.
 */
function createAssistantMessageCommitter({
  chatId,
  initialMessages,
  initialAssistantMessage,
  messagesRef,
  setConversation,
}) {
  let liveMessages = initialMessages;
  let liveAssistantMessage = initialAssistantMessage;

  function commit(patch = {}) {
    // 1단계: 타깃 AI 말풍선 조각의 데이터를 최신화 갱신합니다.
    liveAssistantMessage = {...liveAssistantMessage, ...patch};
    // 2단계: 불변성을 준수하며 배열 내 해당 메시지 요소를 스왑 치환합니다.
    liveMessages = liveMessages.map((message) =>
      message.id === liveAssistantMessage.id ? liveAssistantMessage : message
    );
    // 3단계: Vue 3 화면 반응형 레퍼런스 주입 및 전역 영구 스토어 저장소 상태를 동시 동기화 수립합니다.
    messagesRef.value = liveMessages;
    setConversation(chatId, liveMessages);
  }

  return {
    commit,
    getAssistantMessage: () => liveAssistantMessage,
    getMessages: () => liveMessages,
  };
}

/**
 * 추론형 프리-토큰 청크(Thinking) 단계를 지나 실제 텍스트 답변 청크 조각이 처음 안착하는 순간,
 * 화면 UI 레이아웃의 '생각하는 중' 토글을 걷어내고 텍스트 스트리밍 필드로 모드를 대전환합니다.
 */
async function commitFirstAnswerChunk({content, getAssistantMessage, commit}) {
  if (getAssistantMessage().reasoningStatus === "thinking") {
    commit({reasoningStatus: "completed"});
    await nextTick();
  }

  commit({content, status: "streaming"});
}

/**
 * 유저가 인풋창에서 엔터를 쳐서 질문을 전송한 직후,
 * 사용자 커스텀 자동 스크롤 옵션 스냅샷을 판별해 최하단으로 내리거나 유저 질문 라인으로 화면을 포커싱 앵커링합니다.
 */
async function scrollAfterUserSubmit(options) {
  await nextTick();

  if (options.autoScrollOnAnswer?.value) {
    await options.scrollBottom({force: true, stable: true, autoAnswer: true});
    return;
  }

  await options.scrollLatestUserMessage?.({
    behavior: "auto",
    stable: true,
    offset: 16,
  });
}

/**
 * 백엔드 통신용 규격에 맞는 직렬화 완료된 대화 생성 페이로드 팩을 빌드합니다.
 */
function createGenerationPayload(options, normalized, chatId) {
  return createRequestPayload({
    assistantId: options.selectedAssistantId?.value || "",
    modelId: options.selectedModel?.value || "",
    isReasoning: isSelectedModelReasoning(options),
    input: normalized.text,
    chatId,
  });
}

/**
 * @function createConversationForSubmit
 * @description [대화 서랍 최초 자동 개통 레이어] 유저가 홈(Main) 화면이나 빈 엔트리 진입로에서 첫 질문을 던진 상황인 경우,
 * 백엔드 원격지에 대화방 고유 세션 데이터베이스 생성을 선행 요청(`new.do`)하고 실패 시 프론트 자체 인메모리 로컬 세션으로 비상 가드 시동합니다.
 */
async function createConversationForSubmit(options, normalized) {
  const context = {
    assistantId: options.selectedAssistantId?.value || "",
    modelId: options.selectedModel?.value || "",
  };

  if (typeof options.createConversation === "function") {
    return options.createConversation(normalized, context);
  }

  try {
    return await options.createRemoteConversation({
      text: normalized.text,
      assistantId: context.assistantId,
      modelId: context.modelId,
    });
  } catch (error) {
    logWarn(
      "[useChatSubmit] new.do 호출 실패, local conversation으로 대체:",
      error
    );
    // 서버 가동 불능 시 유저 경험 유지를 위해 메모리 기반 가상 로컬 대화방을 로컬 개통 처리합니다.
    return options.createLocalConversation(normalized);
  }
}

/**
 * @function runAssistantStream
 * @description 저수준 SSE 스트리밍 통신 라인과 직접 체인하여 실시간으로 뿜어져 나오는 데이터 청크들을 받아 처리하는 가동 핵심 총괄 유닛입니다.
 */
async function runAssistantStream({
  options,
  normalized,
  chatId,
  commit,
  getAssistantMessage,
  scheduleStreamScroll,
  abortFallbackMessage,
  errorFallbackMessage,
  logPrefix,
}) {
  try {
    // 가공 완료된 데이터 본체를 넘기고 SSE 청크 스위칭 바인딩 리스너 허브를 개통합니다.
    await streamGeneration(
      createGenerationPayload(options, normalized, chatId),
      {
        // 분기 A: 오미크론/o1 등 추론 모델이 생각을 전개하는 단계의 텍스트가 인입될 때 호출
        onReasonChunk: async (reasoningContent) => {
          commit({reasoningContent, reasoningStatus: "thinking"});
          scheduleStreamScroll(); // 스크롤 헬퍼에게 마이크로태스크 큐 렌더링 위임
        },
        // 분기 B: 실제 최종 답변 텍스트 문자열 조각이 인입될 때 호출
        onChunk: async (content) => {
          await commitFirstAnswerChunk({content, getAssistantMessage, commit});
          scheduleStreamScroll();
        },
        // 분기 C: 백엔드가 데이터 전송이 끝났음을 공인 선언했을 때 호출
        onComplete: () => {
          commit({status: "complete", reasoningStatus: "completed"});
        },
      }
    );

    // 안전하게 정상 마무리되었다면 완결 상태로 최종 동결 잠금 처리합니다.
    commit({status: "complete", reasoningStatus: "completed"});
    await nextTick();
    await options.renderAfterStream(); // 인라인 마크다운 다이어그램(Mermaid) 최종 그래픽 드로잉 치환 지시
  } catch (error) {
    const isAbort = isGenerationAbortError(error);
    logWarn(
      `${logPrefix} ${isAbort ? "스트리밍이 중단되었습니다" : "스트리밍 오류"}:`,
      error
    );

    // [서버 원격 백업 데이터 정합성 구출 작전 기동]
    // 스트리밍 도중 커넥션이 폭파된 경우 우선 원격지 REST 결과 조회 저장소를 1차 스캔합니다.
    const syncedContent = await resolveGenerationResultContent(
      error.generationRequestId
    );
    // REST 구출 데이터 -> 스트리밍 도중 확보한 로컬 누적 버퍼 찌꺼기 -> 직전 말풍선 텍스트 -> 최종 실패 안내 문구 순으로 가드 폴백합니다.
    const fallbackContent =
      syncedContent ||
      error.accumulated ||
      getAssistantMessage().content ||
      (isAbort ? abortFallbackMessage : errorFallbackMessage);

    commit({
      status: fallbackContent ? "complete" : "error",
      reasoningStatus: "completed",
      content: fallbackContent,
    });
  }
}

/**
 * @function useChatSubmit
 * @description Vue 3 인풋 입력 단 컴포넌트와 직접 연동되어 신규 질문 전송(`submit`) 및 대화 답변 재생성(`regenerate`) 트랜잭션을 전담 관제하는 노출 컴포저블 마스터 엔진입니다.
 */
export function useChatSubmit(options) {
  const isGenerating = ref(false); // 현재 AI 답변이 타이핑 스트리밍 출력 중인지 타내는 글로벌 반응형 상태 키
  const chatStreamStore = useChatStreamStore(); // 전역 하단 로딩 바 및 인풋 바 비활성화 연동용 Pinia 스토어 가치 구독

  /**
   * @function submitPrompt
   * @description 사용자가 인풋 필드에 새 질문을 쓰고 전송 버튼을 누르는 순간 진입하는 마스터 메인 트리거 게이트웨이입니다.
   */
  async function submitPrompt(payload) {
    const normalized = normalizePromptPayload(payload);
    // 권한 검증 미통과, 빈 문자열 유실 전송, 혹은 이미 답변이 출력 중인 중복 전송 상태인 경우 실행을 원천 차단 가드합니다.
    if (
      !canWrite(options) ||
      (!normalized.text && normalized.attachments.length === 0) ||
      isGenerating.value
    ) {
      return;
    }

    let targetHistoryId = String(options.route.params.id || "");

    // [체크 유닛] 현재 라우팅 주소가 홈(Main)이거나 신규 방 생성이 수반되어야 하는 상태인 경우
    if (
      options.route.name === "main" ||
      options.route.name === "chat-entry" ||
      !targetHistoryId
    ) {
      // 백엔드 세션 방 생성을 선행 유도합니다.
      const history = await createConversationForSubmit(options, normalized);
      targetHistoryId = history.id;

      // 주소창을 새로 개통된 대화방 전용 고유 주소 파라미터(`chat/:id`) 구조로 강제 강격 포워딩 전환합니다.
      await options.router
        .push({name: "chat", params: {id: targetHistoryId}})
        .catch(() => {});
      await nextTick();
    }

    // 1단계: 유저 대화 말풍선 객체와 껍데기만 수립된 AI 대기조 말풍선 한 쌍을 로컬 스토어 화면 배열 꼬리에 즉각 밀어 넣습니다.
    const {messages, assistantMessage} = options.appendUserAndAssistantMessages(
      targetHistoryId,
      normalized
    );
    // 2단계: 사이드바 서랍 타이틀 텍스트를 최신 백그라운드 스냅샷 동기화 처리합니다.
    options.syncHistories?.();

    // 3단계: 가동 준비가 완료된 원소 정보들을 토대로 실시간 데이터 불변성 보정용 커미터 큐 인스턴스를 조립합니다.
    const committer = createAssistantMessageCommitter({
      chatId: targetHistoryId,
      initialMessages: messages,
      initialAssistantMessage: {
        ...assistantMessage,
        ...createAssistantStreamingPatch(isSelectedModelReasoning(options)),
      },
      messagesRef: options.messages,
      setConversation: options.setConversation,
    });

    // 4단계: 초고속 인입 버퍼 정렬을 유도할 마이크로태스크 스크롤 스케줄러 기동 준비 완료
    const scheduleStreamScroll = createStreamScrollScheduler(options);

    committer.commit(); // 화면에 최초 스트리밍 대기 상태 레이아웃 마운트 집행
    await scrollAfterUserSubmit(options);

    isGenerating.value = true;
    chatStreamStore.start(); // 하단 텍스트 인풋 박스를 '생성 중... 잠금 및 취소 버튼 활성화' 상태로 UI 모드 격상

    try {
      // 5단계: 대망의 SSE 비동기 무한 스트림 가동 파이프라인 엔진을 정식 점화합니다.
      await runAssistantStream({
        options,
        normalized,
        chatId: targetHistoryId,
        commit: committer.commit,
        getAssistantMessage: committer.getAssistantMessage,
        scheduleStreamScroll,
        abortFallbackMessage: "(응답 생성이 중단되었습니다.)",
        errorFallbackMessage: "(응답 생성 중 오류가 발생했습니다.)",
        logPrefix: "[useChatSubmit]",
      });
    } finally {
      // 어떤 치명적 시스템 장애나 유저 강제 취소 명령이 발동하더라도, 인풋 잠금 락 플래그만큼은 안전하게 영구 소거 소멸 원복 처리합니다.
      isGenerating.value = false;
      chatStreamStore.finish();
    }
  }

  /**
   * @function regenerateResponse
   * @description 특정 AI 말풍선 하단의 '다시 생성하기' 아이콘 버튼을 눌렀을 때 작동하는 재생성 전용 엔지니어링 파이프라인입니다.
   * @param {Object} message - 사용자가 재생성을 명령한 기존 대상 어시스턴트 말풍선 원본 레코드 객체
   */
  async function regenerateResponse(message = {}) {
    if (!canWrite(options) || isGenerating.value) return;

    const targetHistoryId = String(options.route.params.id || "");
    if (!targetHistoryId) return;

    const currentMessages = Array.isArray(options.messages.value)
      ? options.messages.value
      : [];
    // 역추적 연산: 재생성 대상 말풍선의 배열 내 색인 포인터를 탐색합니다.
    const assistantIndex = currentMessages.findIndex(
      (item) => item.id === message.id
    );
    if (assistantIndex <= 0) return; // 첫 단락 이하 예외 규격 세션 검증 가드

    // 탐색 완료된 AI 말풍선 인덱스 바로 윗단에 실재하는 실제 유저의 '원본 질문 내용' 컨텍스트 소스를 역추적 스캔해 냅니다.
    const userMessage = [...currentMessages]
      .slice(0, assistantIndex)
      .reverse()
      .find((item) => item.role === "user");
    if (!userMessage) return;

    // 원본 질문 내용 및 예전 첨부 자원을 원복 빌드 규격화합니다.
    const normalized = normalizePromptPayload({
      text: userMessage.content,
      attachments: userMessage.attachments || [],
    });

    // 과거 실패했거나 맘에 안 들어 하던 기존 하위 대화 말풍선 라인업 전체를 배열 칼치기로 도려내고 신규 메시지 슬롯으로 치환 주입합니다.
    const assistantMessage = {
      id: createId("message"),
      role: "assistant",
      content: "",
      ...createAssistantStreamingPatch(isSelectedModelReasoning(options)),
      createdAt: new Date().toISOString(),
    };

    const committer = createAssistantMessageCommitter({
      chatId: targetHistoryId,
      initialMessages: [
        ...currentMessages.slice(0, assistantIndex), // 과거 정상 대화 라인까지만 보존 상속
        assistantMessage, // 교체 주입된 새로운 실시간 재생성 타깃 메시지 슬롯
      ],
      initialAssistantMessage: assistantMessage,
      messagesRef: options.messages,
      setConversation: options.setConversation,
    });

    const scheduleStreamScroll = createStreamScrollScheduler(options);

    committer.commit();
    await nextTick();
    await options.scrollBottom({force: true, stable: true, autoAnswer: true});

    isGenerating.value = true;
    chatStreamStore.start();

    try {
      // 동일 질문 본문을 기반으로 비동기 스트림 파이프라인을 2회차 재차 재구동합니다.
      await runAssistantStream({
        options,
        normalized,
        chatId: targetHistoryId,
        commit: committer.commit,
        getAssistantMessage: committer.getAssistantMessage,
        scheduleStreamScroll,
        abortFallbackMessage: "(응답 재생성이 중단되었습니다.)",
        errorFallbackMessage: "(응답 재생성 중 오류가 발생했습니다.)",
        logPrefix: "[useChatSubmit] 재생성",
      });
    } finally {
      isGenerating.value = false;
      chatStreamStore.finish();
    }
  }

  // 상위 컨트롤러 허브가 장착 활용할 전송 제어 API 인터페이스 버스 최종 반환 노출
  return {
    isGenerating,
    submit: submitPrompt,
    regenerate: regenerateResponse,
  };
}
