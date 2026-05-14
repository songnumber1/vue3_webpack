# Vue Chat Markdown Unified Demo

Vue 3 Composition API 기반 Chat UI에 unified(remark/rehype) Markdown 렌더링을 적용한 버전입니다.

## 실행

```bash
npm install
npm run serve
```

## 빌드 검증

```bash
npm run build
```

## 적용 내용

- `unified` 기반 Markdown 렌더러 적용
- `remark-gfm` 적용: table, checkbox, strikethrough 등 GFM 문법 지원
- `remark-math` + `rehype-katex` 적용: inline/block LaTeX, KaTeX 렌더링 지원
- `rehype-highlight` 적용: code block syntax highlight 지원
- `rehypeExternalLinks` 적용: 외부 링크 `target="_blank"`, `rel="nofollow noopener noreferrer"` 자동 적용
- 커스텀 `rehypeTableWrapper` 적용: table을 `.md-table-wrapper`로 감싸 WebView 가로 스크롤 안정화
- 커스텀 Mermaid block 변환 적용: ` ```mermaid ` 코드 블록을 `.md-mermaid` DOM으로 변환 후 렌더링
- 메시지 단위 Markdown 렌더링 적용: 전체 watch가 아니라 `ChatMessage` 단위로 처리
- `undefined/null` 입력은 `String(text ?? '')`로 안전 처리
- 대화방 입장 시 `public/samples/markdown-showcase.md` 파일을 읽어 50개 Markdown 유형 샘플 자동 표시

## 주요 파일

| 파일 | 역할 |
| --- | --- |
| `src/utils/markdown.js` | unified 파이프라인 및 rehype plugin 구성 |
| `src/utils/mermaidRenderer.js` | Mermaid lazy load 및 DOM 후처리 |
| `src/utils/markdownSamples.js` | public markdown 샘플 파일 로드 |
| `src/components/chat/ChatMessage.vue` | 메시지 단위 async Markdown 렌더링 |
| `src/components/chat/ChatShell.vue` | 대화방 입장 시 Markdown 샘플 메시지 초기화 |
| `public/samples/markdown-showcase.md` | 50개 유형 Markdown 샘플 |
| `src/assets/styles/chat.css` | Markdown/table/code/KaTeX/Mermaid WebView 대응 스타일 |

## 참고

Mermaid는 번들 크기와 인증 이슈를 피하기 위해 npm 패키지로 포함하지 않고, 필요한 경우 CDN에서 lazy load합니다. 네트워크가 차단된 환경에서는 Mermaid 소스 블록이 안전하게 남고 앱은 오류 없이 동작합니다.

## 2026-05 Markdown 샘플 채팅방 / Mermaid 다크 테마 보정

- 최초 접속 시 `markdown-showcase.md`가 자동 표시되지 않도록 변경했습니다.
- 사이드바 `최근` 목록의 마지막 항목에 `Markdown 통합 렌더링 50가지 샘플` 채팅방을 추가했습니다.
- 해당 채팅방을 선택하면 `public/samples/markdown-showcase.md`가 assistant 메시지로 렌더링됩니다.
- Mermaid는 현재 테마 기준으로 초기화되며, 다크 테마에서 노드/텍스트/선/화살표가 보이도록 CSS와 themeVariables를 함께 보정했습니다.
- 테마 전환 시 이미 렌더링된 Mermaid SVG를 원본 source 기준으로 다시 렌더링합니다.



## Development Quality Tools

### Install
```bash
npm install
```

### ESLint
```bash
npm run lint
npm run lint:fix
```

### Prettier
```bash
npm run format
```

Node.js 16 compatible ESLint and Prettier packages have been added.
