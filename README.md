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
