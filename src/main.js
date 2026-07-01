/**
 * @file main.js
 * @description Vue 애플리케이션 부트스트랩 진입점입니다. Pinia, Router, i18n, 전역 초기화가 실제 화면 렌더 전에 연결됩니다.
 */

import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";
// Tailwind is loaded before the legacy SCSS baseline.
// preflight is disabled in tailwind.config.js, so before_front reset/keyboard/scroll behavior remains the source of truth.
import "@/assets/styles/tailwind/index.scss";
import {bootstrap} from "@/core/bootstrap";
import "@/assets/styles/index.scss";

import {installViewportCssVars} from "@/platform/viewport/viewportCssVars";

installViewportCssVars();
bootstrap();
