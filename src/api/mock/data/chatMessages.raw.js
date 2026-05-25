/**
 * @file api/mock/data/chatMessages.raw.js
 * @description 개발/데모용 mock API 또는 mock 데이터입니다. 실제 API 비활성화 시 화면 동작을 보장합니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

const user = (id, content, sendTime) => ({
  role: "user",
  content,
  id,
  isSend: true,
  isRAG: false,
  isRagCot: false,
  intention: "직접입력",
  sendTime,
  tags: [],
  refreences: [],
});
const assistant = (id, content, sendTime, references = []) => ({
  role: "assistant",
  content,
  id,
  isSend: true,
  isRAG: references.length > 0,
  isRagCot: false,
  intention: null,
  sendTime,
  tags: references.length ? ["RAG", "source"] : [],
  refreences: references,
});

export const CHAT_MESSAGES_RAW = {
  "chat-deleted-model": [
    user(
      "msg-deleted-1",
      "이전 모델로 작성했던 답변을 다시 확인하고 싶어",
      "2026-05-15T08:20:00Z"
    ),
    assistant(
      "msg-deleted-2",
      `이 대화는 현재 삭제된 모델로 생성된 이전 대화입니다.

기존 메시지는 계속 확인할 수 있지만, 동일한 모델로 새 질의를 이어서 보낼 수는 없습니다.

| 상태 | 설명 |
|---|---|
| 대화방 입장 | 가능 |
| 이전 메시지 조회 | 가능 |
| 새 질의 입력 | 불가 |

새 질문을 하려면 좌측 상단에서 사용 가능한 Assistant 또는 모델을 선택해 새 대화를 시작하세요.`,
      "2026-05-15T08:20:05Z"
    ),
  ],
  "chat-md-showcase": [
    user(
      "msg-md-1",
      "Markdown으로 표, mermaid, 코드, 외부 링크, 이미지, 수식까지 한 번에 렌더링되는지 확인해줘",
      "2026-05-15T09:00:00Z"
    ),
    assistant(
      "msg-md-2",
      `아래는 Markdown 렌더링 종합 테스트입니다.

## 1. 표 렌더링

| 항목 | 상태 | 비고 |
|---|---:|---|
| API Mock | 정상 | Promise 기반 |
| Adapter | 정상 | legacy key 흡수 |
| 모바일 스크롤 | 점검 필요 | viewport 별도 확인 |

## 2. Mermaid

\`\`\`mermaid
flowchart TD
  A[AppContainer] --> B[Business Layer]
  B --> C[Mock API]
  C --> D[Raw Data]
  B --> E[Adapter]
  E --> F[Pinia Store]
  F --> G[UI Components]
\`\`\`

## 3. Source Code

\`\`\`js
export async function bootstrapChatRuntime() {
  const [accessInfo, assistants, studios, models, studioModels, histories] = await Promise.all([
    accessApi.getAccessInfo(),
    assistantApi.getAssistants(),
    assistantApi.getStudios(),
    modelApi.getModels(),
    modelApi.getStudioModels(),
    chatHistoryApi.getChatHistoryList(),
  ]);

  
  return normalizeBootstrapResult({ accessInfo, assistants, studios, models, studioModels, histories });
}
\`\`\`

## 4. 외부 링크

- [Vue Router 공식 문서](https://router.vuejs.org/)
- [Pinia 공식 문서](https://pinia.vuejs.org/)

## 5. 이미지

![샘플 이미지](https://picsum.photos/seed/ds-assistant/720/260)

## 6. 수학 수식

인라인 수식은 $E = mc^2$ 형태입니다.

블록 수식은 아래처럼 표시됩니다.

$$
request_time = network + backend + render
$$

## 7. 체크리스트

- [x] 표 렌더링
- [x] 코드 하이라이트
- [x] Mermaid 렌더링
- [x] 외부 링크
- [x] 이미지
- [x] 수식

> 긴 콘텐츠에서도 모바일 화면이 깨지지 않는지 확인해야 합니다.`,
      "2026-05-15T09:00:08Z",
      [{title: "Vue Router", url: "https://router.vuejs.org/"}]
    ),
  ],
  "chat-architecture": [
    user(
      "msg-arch-1",
      "운영 백엔드는 유지하고 프론트만 mock api, adapter, business, pinia로 나누는 구조가 맞을까?",
      "2026-05-14T17:00:00Z"
    ),
    assistant(
      "msg-arch-2",
      `맞습니다. 핵심은 **운영 API 구조를 UI에 직접 노출하지 않는 것**입니다.

\`\`\`mermaid
sequenceDiagram
  participant UI as Component
  participant C as Container
  participant B as Business
  participant A as Adapter
  participant API as Mock/Live API
  UI->>C: 이벤트 전달
  C->>B: use case 호출
  B->>API: Promise.all API 호출
  API-->>B: raw response
  B->>A: normalize
  A-->>B: view model
  B-->>C: 화면 데이터
  C->>UI: props 전달
\`\`\`

### 분리 기준

| 계층 | 역할 | 금지 사항 |
|---|---|---|
| component | 렌더링 | API key 접근 |
| container | 연결/상태 반영 | raw response 직접 렌더링 |
| business | orchestration | DOM 접근 |
| adapter | key 변환 | API 호출 |
| mock/live api | 호출 형태 유지 | UI model 반환 |

이 구조면 나중에 \`assistId\`가 \`assistantId\`로 바뀌어도 adapter만 수정하면 됩니다.`,
      "2026-05-14T17:00:10Z"
    ),
  ],
  "chat-mobile-sheet": [
    user(
      "msg-sheet-1",
      "모바일 WebView에서 bottom sheet가 살짝만 보이고 리스트가 안 보이는 이유가 뭐야?",
      "2026-05-13T21:30:00Z"
    ),
    assistant(
      "msg-sheet-2",
      `가능성이 높은 원인은 viewport 높이 계산과 overflow 계층 충돌입니다.

\`\`\`css
.mobile-bottom-sheet {
  max-height: min(82dvh, 640px);
  overflow: hidden;
}

.mobile-bottom-sheet__content {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
\`\`\`

확인 포인트:

1. 부모 요소에 \`overflow: hidden\`이 과도하게 걸려 있는지
2. \`100vh\` 대신 \`100dvh\` 또는 runtime viewport variable을 쓰는지
3. Android WebView에서 safe-area/keyboard 진입 시 높이 재계산이 되는지`,
      "2026-05-13T21:30:08Z"
    ),
  ],
  "chat-close-wait": [
    user(
      "msg-close-1",
      "Spring Boot WebClient에서 CLOSE_WAIT가 생길 수 있는 코드 흐름을 표로 정리해줘",
      "2026-05-12T15:50:00Z"
    ),
    assistant(
      "msg-close-2",
      `아래처럼 원인과 대응을 분리해서 보는 것이 좋습니다.

| 구간 | 원인 후보 | 대응 |
|---|---|---|
| Vue SSE | abort 누락 | AbortController 정리 |
| Spring WebClient | 응답 stream dispose 누락 | doFinally에서 정리 |
| DB 저장 | 종료 signal 지연 | 비동기 큐/timeout 적용 |
| Linux | rx buffer 적체 | 커널 지표 모니터링 |

\`\`\`java

return webClient.post()
    .uri("/external/stream")
    .retrieve()
    .bodyToFlux(String.class)
    .timeout(Duration.ofSeconds(60))
    .doFinally(signalType -> {
        connection.dispose();
    });
\`\`\`

> 실제 운영에서는 dispose만으로 끝내지 말고, timeout, cancel, DB 저장 흐름까지 같이 봐야 합니다.`,
      "2026-05-12T15:50:09Z"
    ),
  ],
  "chat-api-constant": [
    user(
      "msg-api-1",
      "API key와 URL을 constant로 빼면 어떤 장점이 있어?",
      "2026-05-11T11:20:00Z"
    ),
    assistant(
      "msg-api-2",
      `가장 큰 장점은 변경 범위 축소입니다.

\`\`\`js
export const CHAT_KEYS = Object.freeze({
  ID: 'chatId',
  TITLE: 'chatTitle',
  LEGACY_MODEL_ID: 'modeId',
});
export function adaptChatHistory(raw) {
  
  return {
    id: raw[CHAT_KEYS.ID],
    title: raw[CHAT_KEYS.TITLE],
    modelId: raw.modelId ?? raw[CHAT_KEYS.LEGACY_MODEL_ID],
  };
}
\`\`\`

이렇게 하면 \`modeId\` 오타가 실제로 \`modelId\`로 바뀌어도 adapter만 수정하면 됩니다.`,
      "2026-05-11T11:20:06Z"
    ),
  ],
  "chat-writing-notice": [
    user(
      "msg-writing-1",
      "운영 정책 변경 공지를 부드럽지만 명확하게 정리해줘",
      "2026-05-10T10:10:00Z"
    ),
    assistant(
      "msg-writing-2",
      `아래처럼 정리하면 좋습니다.

> 안녕하세요. 최근 경조사 및 운영 기준과 관련하여 일부 항목이 불명확하다는 의견이 있어 운영진에서 기준을 다시 정리했습니다.
>
> 내용을 확인하신 뒤 형평성에 맞지 않거나 보완이 필요한 부분이 있다면 이번 주까지 개별적으로 의견 부탁드립니다.
>
> 접수된 의견은 취합 후 다음 주 중 최종 공지로 공유드리겠습니다.

핵심은 **의견 수렴 기간**, **수정 가능성**, **최종 공유 일정**을 명확하게 쓰는 것입니다.`,
      "2026-05-10T10:10:07Z"
    ),
  ],
  "chat-data-table": [
    user(
      "msg-data-1",
      "테이블 복사와 CSV 다운로드 UX를 어떻게 구성하면 좋아?",
      "2026-05-09T15:00:00Z"
    ),
    assistant(
      "msg-data-2",
      `권장 UX는 버튼 텍스트보다 아이콘 중심입니다.

| 기능 | 아이콘 | 위치 | 비고 |
|---|---|---|---|
| 테이블 복사 | copy | 테이블 우측 상단 | clipboard fallback 필요 |
| CSV 다운로드 | csv | 테이블 우측 상단 | 파일명 규칙 필요 |
| 코드 복사 | copy | code block 우측 상단 | 성공 toast 표시 |

파일명 예시:

\`\`\`js
const filename = \`table-${new Date().toISOString().slice(0, 10)}.csv\`;
\`\`\``,
      "2026-05-09T15:00:08Z"
    ),
  ],
  "chat-marketing-copy": [
    user(
      "msg-mkt-1",
      "신규 기능 출시 안내 문구를 만들어줘",
      "2026-05-08T14:00:00Z"
    ),
    assistant(
      "msg-mkt-2",
      `물론입니다.

### 출시 안내 문구 샘플

1. 새로운 Assistant 선택 기능으로 업무 흐름을 더 빠르게 시작해보세요.
2. 이제 모델과 Assistant를 상황에 맞게 선택할 수 있습니다.
3. 자주 쓰는 대화는 고정하고, 필요한 모델은 바로 전환하세요.

짧은 배너 문구:

> 내 업무에 맞는 Assistant를 선택하세요.`,
      "2026-05-08T14:00:05Z"
    ),
  ],
};
