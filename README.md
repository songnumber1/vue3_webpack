# Vue 3 ChatGPT Style WebApp

Vue 3 Composition API + Webpack(Vue CLI) 기반의 ChatGPT 스타일 UI/UX 샘플입니다.

## 포함 기능

- `main.js`는 `bootstrap()`만 호출
- Android/Web/Mobile-Web 플랫폼 resolver
- Base + Android override 방식의 axios/api/router/storage/feature/theme resolver
- 모바일 크기 또는 모바일 브라우저에서는 AndroidLayout 적용
- API 없이 동작하는 가짜 스트리밍 채팅 UI
- 라이트/다크 테마 CSS variable 구조
- 추후 테마 추가가 쉬운 `src/assets/styles/themes.css` 구조
- 반응형 PC/모바일 레이아웃

## 실행

```bash
npm install
npm run serve
```

브라우저에서 `http://localhost:8080`으로 접속합니다.

## 빌드

```bash
npm run build
```

## 주요 파일

```text
src/main.js
src/core/bootstrap.js
src/core/resolver/*
src/layouts/WebLayout.vue
src/layouts/AndroidLayout.vue
src/components/chat/*
src/assets/styles/themes.css
```

## 테마 추가 방법

`src/assets/styles/themes.css`에 아래처럼 새 테마를 추가하면 됩니다.

```css
:root[data-theme='blue'] {
  --bg: #eff6ff;
  --surface: #ffffff;
  --text: #0f172a;
  --primary: #2563eb;
}
```

그 후 `src/core/resolver/theme.js`의 `allowedThemes`에 `blue`를 추가하세요.
