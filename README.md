# Vue 3 ChatGPT Style WebApp

Vue 3 Composition API + Webpack 기반의 ChatGPT 스타일 반응형 UI 샘플입니다.

## 포함 사항

- `main.js -> bootstrap()` 앱 시작 구조
- 플랫폼 / 레이아웃 / axios / interceptor / api / router / bridge / storage / theme resolver
- Web ChatGPT 스타일 좌측 고정 사이드바 + 중앙 시작 화면
- Mobile ChatGPT 스타일 Drawer 메뉴 + 상단 모델 선택 + 하단 고정 입력창
- CSS variable 기반 light / dark 테마
- API 없이 동작하는 fake streaming 채팅

## 실행

```bash
npm install
npm run serve
```

## 빌드

```bash
npm run build
```

## 주요 파일

```text
src/core/bootstrap.js
src/core/resolver/*
src/components/chat/ChatShell.vue
src/components/chat/ChatHeader.vue
src/components/chat/PromptInput.vue
src/assets/styles/themes.css
src/assets/styles/chat.css
```

## 설계 기준

- 웹/모바일 프로젝트를 분리하지 않고 레이아웃과 CSS만 반응형으로 분리합니다.
- 공통 로직은 ChatShell 내부 상태와 resolver 계층에 둡니다.
- 모바일 메뉴는 좌측 Drawer로 제공하고, Drawer 안에서 프로젝트/최근 대화/새 채팅을 선택할 수 있습니다.
- 모델 선택은 ChatGPT 모바일처럼 상단 `ChatGPT` selector에서 dropdown으로 변경합니다.


## Android Chrome / WebView 호환 수정 사항

- `crypto.randomUUID()` 직접 사용을 제거하고 `src/utils/id.js`의 `createId()`로 통합했습니다.
  - 최신 브라우저에서는 `crypto.randomUUID()`를 사용합니다.
  - 미지원 환경에서는 `crypto.getRandomValues()` 기반 UUID v4 fallback을 사용합니다.
  - `getRandomValues()`도 없는 극단적인 환경에서는 `Math.random()` fallback까지 방어합니다.
- `navigator.clipboard.writeText()` 직접 사용을 제거하고 `src/utils/clipboard.js`로 통합했습니다.
  - HTTPS/secure context에서는 Clipboard API를 사용합니다.
  - Android Chrome/WebView에서 제한될 경우 `textarea + document.execCommand('copy')` fallback을 사용합니다.
- `localStorage` 접근을 `src/core/resolver/storage.js`에서 안전하게 감쌌습니다.
  - storage 접근이 막힌 환경에서는 메모리 fallback으로 앱이 죽지 않게 했습니다.
- `matchMedia.addEventListener()`만 사용하는 코드를 `addListener()` fallback까지 지원하도록 수정했습니다.
- 메시지 스크롤은 `nextTick()` 후 `requestAnimationFrame()`으로 실제 렌더 이후 실행되도록 조정했습니다.

### 실행

```bash
npm install
npm run serve
```

### 빌드

```bash
npm run build
```

## 2026-05 Android Chrome/WebView Chat UI 안정화 리팩토링

이번 버전은 PC Chrome, Android Chrome, Android WebView를 우선 대상으로 채팅 입력창 포커스/키보드/스크롤 문제를 줄이기 위해 다음 구조를 추가했습니다.

### 변경 요약

- `src/composables/useViewportGuard.js` 추가
  - `window.innerHeight`, `window.visualViewport`를 함께 감지합니다.
  - 실제 보이는 화면 높이를 `--app-height`, `--vh` CSS 변수로 반영합니다.
  - Android 키보드 오픈 여부를 `keyboardOpen` 상태로 제공합니다.
- `src/composables/useAutoScroll.js` 개선
  - Vue `nextTick()` 이후 `requestAnimationFrame()` 2회 대기 후 스크롤합니다.
  - 키보드 애니메이션/viewport resize 직후 스크롤 계산이 어긋나는 문제를 줄입니다.
- `MessageList.vue` 개선
  - 마지막 메시지 아래 anchor를 추가하고 `scrollIntoView()` 기반으로 스크롤합니다.
- `PromptInput.vue` 개선
  - `focus`, `blur`, `height-change` 이벤트를 외부로 emit합니다.
  - textarea 높이 변경 시 부모가 안전하게 스크롤을 보정할 수 있습니다.
- `ChatShell.vue` 개선
  - viewport guard와 auto scroll을 통합했습니다.
  - 입력창 focus/resize/메시지 streaming 중 마지막 메시지 위치를 계속 보정합니다.
- CSS 개선
  - 모바일에서 입력창 `position: fixed` 의존을 제거하고 grid 하단 영역으로 배치했습니다.
  - `height: var(--app-height)` 기반으로 Android Chrome/WebView 키보드 높이 변화를 반영합니다.

### 테스트

- JS 유틸 파일 문법 체크를 수행했습니다.
- 현재 실행 환경에서는 `node_modules`가 없고 `npm install`이 시간 초과되어 `npm run build`까지는 완료하지 못했습니다.
- 로컬에서는 아래 순서로 확인하면 됩니다.

```bash
npm install
npm run build
npm run serve
```

### 모바일 확인 포인트

1. Android Chrome에서 접속합니다.
2. 채팅 입력창을 터치해 키보드를 엽니다.
3. 마지막 질문/답변 그룹이 키보드에 가려지지 않고 하단으로 보정되는지 확인합니다.
4. 긴 답변 streaming 중에도 하단 스크롤이 유지되는지 확인합니다.
5. PC Chrome에서는 기존 좌측 사이드바와 중앙 입력 UI가 유지되는지 확인합니다.
