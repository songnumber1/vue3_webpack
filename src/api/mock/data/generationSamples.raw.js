export const GENERATION_SAMPLE_RESPONSES = Object.freeze([
  `요청하신 내용을 기준으로 간단히 정리했습니다.\n\n- 프론트엔드 mock 모드에서는 서버 호출 없이 이 응답을 스트리밍처럼 표시합니다.\n- API 모드에서는 backend의 /generation.do stream 응답을 사용합니다.\n- 응답 완료 전에는 좋아요, 싫어요, 피드백 버튼이 표시되지 않습니다.`,
  `아래는 표 렌더링 테스트용 응답입니다.\n\n| 구분 | 설명 | 상태 |\n| --- | --- | --- |\n| Router | /, /chat/:id 기반 화면 전환 | 완료 |\n| SSE | data chunk 수신 후 화면 갱신 | 테스트 |\n| Overlay | 모바일 API 요청 중 터치 차단 | 설정 가능 |\n\n표 복사와 CSV 다운로드 버튼도 함께 확인할 수 있습니다.`,
  `Mermaid 다이어그램 샘플입니다.\n\n\`\`\`mermaid\nflowchart TD\n  A[사용자 입력] --> B{API 모드?}\n  B -- 아니오 --> C[Frontend Mock Stream]\n  B -- 예 --> D[Backend generation.do]\n  D --> E[SSE data chunk]\n  C --> F[화면 실시간 출력]\n  E --> F\n  F --> G[[DONE 후 액션 표시]]\n\`\`\``,
  `이미지와 일반 텍스트가 함께 있는 샘플입니다.\n\n![샘플 이미지](https://placehold.co/720x360?text=Mock+Generation+Image)\n\n이미지 렌더링, 링크 처리, 일반 문단 표시를 함께 확인할 수 있습니다.`,
  `복합 샘플입니다.\n\n## 처리 흐름\n\n1. 사용자가 프롬프트를 입력합니다.\n2. 선택된 Assistant와 Model을 payload에 포함합니다.\n3. API 모드에 따라 mock 또는 backend stream을 선택합니다.\n\n| payload | 값 |\n| --- | --- |\n| assistantId | 현재 선택 Assistant |\n| modelId | 현재 선택 Model |\n| input | 입력 텍스트 |\n\n\`\`\`mermaid\nsequenceDiagram\n  participant U as User\n  participant F as Frontend\n  participant B as Backend\n  U->>F: input submit\n  F->>B: POST /generation.do\n  B-->>F: data chunks\n  B-->>F: [DONE]\n\`\`\`\n\n![복합 샘플](https://placehold.co/640x280?text=Table+Mermaid+Image)`,
]);

export function pickGenerationSample(seed = "") {
  const text = String(seed || "");
  const hash = [...text].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return GENERATION_SAMPLE_RESPONSES[hash % GENERATION_SAMPLE_RESPONSES.length];
}
