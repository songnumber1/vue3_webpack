/**
 * @file main.js
 * @description Vue 애플리케이션 부트스트랩 진입점입니다. Pinia, Router, i18n, 전역 초기화가 실제 화면 렌더 전에 연결됩니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";
// Tailwind is loaded before the legacy SCSS baseline.
// preflight is disabled in tailwind.config.js, so before_front reset/keyboard/scroll behavior remains the source of truth.
import "@/assets/styles/tailwind/index.scss";
import {bootstrap} from "@/core/bootstrap";
import "@/assets/styles/index.scss";

if (process.env.NODE_ENV === "development") {
  import(
    /* webpackChunkName: "virtual-keyboard-debug-style" */
    "@/assets/styles/09-features/virtual-keyboard-debug.scss"
  );
}
import {installViewportCssVars} from "@/platform/viewport/viewportCssVars";

installViewportCssVars();
bootstrap();
