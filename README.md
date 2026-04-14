# Vue 3 Multi Platform Responsive Theme

## 실행

```bash
npm install
npm run dev
```

## 테스트용 URL 예시

- `/#/?platform=web&device=desktop&theme=default`
- `/#/?platform=app&device=mobile&theme=dark`
- `/#/?platform=extension&device=tablet&theme=ocean`
- `/#/?apiVersion=v2&platform=app`

## 핵심 구조

- `config/appConfig.js`: 플랫폼 / 버전 / 테마 / 디바이스 기준 설정
- `core/interceptorResolver.js`: axios interceptor 선택
- `core/adapterResolver.js`: API adapter 선택
- `core/mapperResolver.js`: mapper 선택
- `api/http/createHttpClient.js`: axios 인스턴스 생성
- `bridge/*`: Android WebView bridge 포인트
- `styles/*`: CSS 변수 + 반응형 레이아웃

## 실제 API 연결

`src/config/appConfig.js`의 `apiBaseUrl`과 `endpoints`를 실제 서버 기준으로 교체하면 된다.

## Android WebView

- `window.AndroidBridge`
- `window.Android`
- `window.ReactNativeWebView`

순서로 탐색하도록 구성되어 있다.
